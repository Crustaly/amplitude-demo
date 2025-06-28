#!/usr/bin/env python3
"""
Raspberry Pi Noise Monitor with INMP441 Microphone
Connects to AWS SNS for real-time noise alerts
"""

import time
import json
import math
import threading
import queue
import logging
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
import pyaudio
import numpy as np
from collections import deque

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("noise_monitor.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


class NoiseMonitor:
    def __init__(self, config):
        self.config = config
        self.audio_queue = queue.Queue()
        self.is_recording = False
        self.noise_history = deque(maxlen=100)  # Keep last 100 readings

        # Audio settings for INMP441
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.RATE = 44100

        # Noise thresholds (in dB)
        self.THRESHOLDS = {"ACCEPTABLE": 60, "WARNING": 70, "VIOLATION": 80}

        # AWS SNS client
        self.sns_client = boto3.client(
            "sns",
            aws_access_key_id=config["aws"]["access_key_id"],
            aws_secret_access_key=config["aws"]["secret_access_key"],
            region_name=config["aws"]["region"],
        )

        # Initialize PyAudio
        self.audio = pyaudio.PyAudio()

    def calculate_decibels(self, audio_data):
        """Calculate RMS decibel level from audio data"""
        try:
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_data, dtype=np.int16)

            # Calculate RMS (Root Mean Square)
            rms = np.sqrt(np.mean(audio_array**2))

            # Convert to decibels (reference: 16-bit audio max value = 32767)
            if rms > 0:
                db = 20 * math.log10(rms / 32767) + 90
                return max(0, min(120, db))  # Clamp between 0-120 dB
            else:
                return 0
        except Exception as e:
            logger.error(f"Error calculating decibels: {e}")
            return 0

    def get_noise_status(self, decibel_level):
        """Determine noise status based on decibel level"""
        if decibel_level <= self.THRESHOLDS["ACCEPTABLE"]:
            return "acceptable"
        elif decibel_level <= self.THRESHOLDS["WARNING"]:
            return "warning"
        else:
            return "violation"

    def send_sns_alert(self, decibel_level, status, location="Raspberry Pi"):
        """Send alert to AWS SNS"""
        try:
            timestamp = datetime.now().isoformat()

            message = {
                "timestamp": timestamp,
                "decibel_level": decibel_level,
                "status": status,
                "location": location,
                "device_id": self.config["device"]["id"],
                "message": f"Noise level: {decibel_level:.1f} dB - Status: {status.upper()}",
            }

            # Send to SNS topic
            response = self.sns_client.publish(
                TopicArn=self.config["aws"]["sns_topic_arn"],
                Message=json.dumps(message, default=str),
                Subject=f"Amplitude Alert: {status.upper()} - {decibel_level:.1f} dB",
            )

            logger.info(
                f"SNS alert sent: {message['message']} (MessageId: {response['MessageId']})"
            )
            return response["MessageId"]

        except ClientError as e:
            logger.error(f"Error sending SNS alert: {e}")
            return None

    def send_to_dynamodb(self, decibel_level, status):
        """Send data to DynamoDB via Lambda"""
        try:
            import requests

            payload = {
                "decibelLevel": decibel_level,
                "timestamp": datetime.now().isoformat(),
                "location": "Raspberry Pi",
                "unitId": self.config["device"]["id"],
                "status": status,
                "deviceType": "raspberry_pi",
            }

            response = requests.post(
                self.config["aws"]["lambda_endpoint"],
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )

            if response.status_code == 200:
                logger.info(f"Data sent to DynamoDB: {decibel_level:.1f} dB")
            else:
                logger.warning(f"Failed to send to DynamoDB: {response.status_code}")

        except Exception as e:
            logger.error(f"Error sending to DynamoDB: {e}")

    def audio_callback(self, in_data, frame_count, time_info, status):
        """Audio callback for PyAudio"""
        if self.is_recording:
            self.audio_queue.put(in_data)
        return (in_data, pyaudio.paContinue)

    def process_audio(self):
        """Process audio data from queue"""
        while self.is_recording:
            try:
                # Get audio data from queue
                audio_data = self.audio_queue.get(timeout=1)

                # Calculate decibel level
                decibel_level = self.calculate_decibels(audio_data)
                self.noise_history.append(decibel_level)

                # Determine status
                status = self.get_noise_status(decibel_level)

                # Log current reading
                logger.info(
                    f"Current noise level: {decibel_level:.1f} dB - Status: {status}"
                )

                # Send alert for violations and warnings
                if status in ["warning", "violation"]:
                    self.send_sns_alert(decibel_level, status)

                # Send data to DynamoDB (every 10 seconds)
                if len(self.noise_history) % 10 == 0:
                    avg_level = sum(list(self.noise_history)[-10:]) / 10
                    avg_status = self.get_noise_status(avg_level)
                    self.send_to_dynamodb(avg_level, avg_status)

                # Sleep to control processing rate
                time.sleep(0.1)

            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error processing audio: {e}")

    def start_monitoring(self):
        """Start noise monitoring"""
        try:
            logger.info("Starting noise monitoring...")

            # Open audio stream
            stream = self.audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK,
                stream_callback=self.audio_callback,
            )

            self.is_recording = True

            # Start processing thread
            process_thread = threading.Thread(target=self.process_audio)
            process_thread.daemon = True
            process_thread.start()

            # Start stream
            stream.start_stream()

            logger.info("Noise monitoring started successfully!")

            # Keep main thread alive
            try:
                while self.is_recording:
                    time.sleep(1)
            except KeyboardInterrupt:
                logger.info("Stopping noise monitoring...")
                self.stop_monitoring(stream)

        except Exception as e:
            logger.error(f"Error starting monitoring: {e}")
            self.stop_monitoring()

    def stop_monitoring(self, stream=None):
        """Stop noise monitoring"""
        self.is_recording = False

        if stream:
            stream.stop_stream()
            stream.close()

        self.audio.terminate()
        logger.info("Noise monitoring stopped.")


def load_config():
    """Load configuration from file"""
    try:
        with open("config.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(
            "config.json not found. Please create it with your AWS credentials."
        )
        return None


def main():
    """Main function"""
    logger.info("Starting Amplitude Raspberry Pi Noise Monitor")

    # Load configuration
    config = load_config()
    if not config:
        return

    # Create and start noise monitor
    monitor = NoiseMonitor(config)

    try:
        monitor.start_monitoring()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()
