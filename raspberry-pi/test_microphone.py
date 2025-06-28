#!/usr/bin/env python3
"""
Test script for INMP441 microphone on Raspberry Pi
"""

import pyaudio
import numpy as np
import time
import math


def test_microphone():
    """Test the INMP441 microphone"""

    # Audio settings
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    RECORD_SECONDS = 5

    print("Testing INMP441 Microphone...")
    print("=" * 40)

    # Initialize PyAudio
    audio = pyaudio.PyAudio()

    try:
        # List available audio devices
        print("Available audio devices:")
        for i in range(audio.get_device_count()):
            device_info = audio.get_device_info_by_index(i)
            print(f"  {i}: {device_info['name']}")

        print("\n" + "=" * 40)

        # Open audio stream
        print("Opening audio stream...")
        stream = audio.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK,
        )

        print("Recording for 5 seconds...")
        print("Speak or make some noise to test the microphone.")
        print("=" * 40)

        frames = []
        decibel_readings = []

        # Record audio
        for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
            data = stream.read(CHUNK)
            frames.append(data)

            # Calculate decibel level
            audio_array = np.frombuffer(data, dtype=np.int16)
            rms = np.sqrt(np.mean(audio_array**2))

            if rms > 0:
                db = 20 * math.log10(rms / 32767) + 90
                db = max(0, min(120, db))
                decibel_readings.append(db)

                # Show real-time decibel level
                status = "OK"
                if db > 80:
                    status = "LOUD!"
                elif db > 70:
                    status = "WARNING"

                print(f"Decibel: {db:6.1f} dB - {status}")

        # Stop and close stream
        stream.stop_stream()
        stream.close()

        print("=" * 40)
        print("Recording complete!")

        # Calculate statistics
        if decibel_readings:
            avg_db = np.mean(decibel_readings)
            max_db = np.max(decibel_readings)
            min_db = np.min(decibel_readings)

            print(f"Average decibel level: {avg_db:.1f} dB")
            print(f"Maximum decibel level: {max_db:.1f} dB")
            print(f"Minimum decibel level: {min_db:.1f} dB")

            # Determine overall status
            if max_db > 80:
                print("Status: VIOLATION - Very loud noise detected!")
            elif max_db > 70:
                print("Status: WARNING - Loud noise detected")
            else:
                print("Status: ACCEPTABLE - Normal noise levels")

        print("\nMicrophone test completed successfully!")

    except Exception as e:
        print(f"Error during microphone test: {e}")
        print("\nTroubleshooting tips:")
        print("1. Check microphone connections")
        print("2. Verify I2S is enabled: sudo raspi-config")
        print("3. Check audio permissions: sudo usermod -a -G audio $USER")
        print("4. Reboot after making changes")

    finally:
        audio.terminate()


def test_audio_devices():
    """Test available audio devices"""
    audio = pyaudio.PyAudio()

    print("Audio Device Test")
    print("=" * 40)

    for i in range(audio.get_device_count()):
        device_info = audio.get_device_info_by_index(i)
        print(f"Device {i}: {device_info['name']}")
        print(f"  Max Input Channels: {device_info['maxInputChannels']}")
        print(f"  Default Sample Rate: {device_info['defaultSampleRate']}")
        print(
            f"  Host API: {audio.get_host_api_info_by_index(device_info['hostApi'])['name']}"
        )
        print()

    audio.terminate()


if __name__ == "__main__":
    print("INMP441 Microphone Test")
    print("=" * 40)

    # Test audio devices first
    test_audio_devices()

    # Ask user if they want to proceed with recording test
    response = input("\nDo you want to test recording? (y/n): ")
    if response.lower() in ["y", "yes"]:
        test_microphone()
    else:
        print("Test completed.")
