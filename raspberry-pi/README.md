# Amplitude Raspberry Pi Noise Monitor

This directory contains the Raspberry Pi implementation of the Amplitude noise monitoring system using an INMP441 I2S MEMS microphone.

## Hardware Requirements

- Raspberry Pi (3B+, 4B, or newer)
- INMP441 I2S MEMS Microphone
- Jumper wires
- Breadboard (optional)
- MicroSD card with Raspberry Pi OS

## Quick Start

### 1. Hardware Setup

1. **Power off your Raspberry Pi** before making connections
2. Connect the INMP441 microphone to the Raspberry Pi:
   - VDD → 3.3V
   - GND → GND
   - SD → GPIO 21 (BCM)
   - L/R → GPIO 20 (BCM)
   - SCK → GPIO 18 (BCM)

3. **Enable I2S interface:**
   ```bash
   sudo raspi-config
   ```
   - Go to "Interface Options"
   - Enable "I2S"
   - Reboot

### 2. Software Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd amplitude/raspberry-pi
   ```

2. **Set up AWS credentials:**
   ```bash
   chmod +x setup_aws.sh
   ./setup_aws.sh
   ```

3. **Install dependencies:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

4. **Test the microphone:**
   ```bash
   python3 test_microphone.py
   ```

5. **Start monitoring:**
   ```bash
   python3 noise_monitor.py
   ```

## Configuration

### config.json

The main configuration file contains:

```json
{
  "device": {
    "id": "raspberry_pi_001",
    "name": "Amplitude Noise Monitor",
    "location": "Apartment 101"
  },
  "aws": {
    "access_key_id": "YOUR_AWS_ACCESS_KEY_ID",
    "secret_access_key": "YOUR_AWS_SECRET_ACCESS_KEY",
    "region": "us-east-1",
    "sns_topic_arn": "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:amplitude-noise-alerts",
    "lambda_endpoint": "https://5hn9hxwix4.execute-api.us-east-1.amazonaws.com/dev/noise"
  },
  "monitoring": {
    "sample_rate": 44100,
    "chunk_size": 1024,
    "channels": 1,
    "thresholds": {
      "acceptable": 60,
      "warning": 70,
      "violation": 80
    }
  }
}
```

### Noise Thresholds

- **Acceptable**: ≤ 60 dB (normal conversation)
- **Warning**: 61-70 dB (loud conversation)
- **Violation**: > 70 dB (excessive noise)

## Features

### Real-time Monitoring
- Continuous audio monitoring using INMP441 microphone
- Real-time decibel level calculation
- Automatic status determination based on thresholds

### AWS Integration
- **SNS Alerts**: Sends notifications when noise levels exceed thresholds
- **DynamoDB Storage**: Stores noise data for historical analysis
- **Lambda Integration**: Processes data and triggers additional actions

### System Service
- Runs as a systemd service for automatic startup
- Automatic restart on failure
- Logging to system journal

## File Structure

```
raspberry-pi/
├── noise_monitor.py      # Main monitoring script
├── test_microphone.py    # Microphone test utility
├── config.json          # Configuration file
├── requirements.txt     # Python dependencies
├── setup.sh            # System setup script
├── setup_aws.sh        # AWS credentials setup
├── wiring_diagram.md   # Hardware connection guide
└── README.md           # This file
```

## AWS Infrastructure

### Required AWS Services

1. **SNS Topic**: For sending noise alerts
2. **DynamoDB Table**: For storing noise data
3. **Lambda Function**: For processing SNS messages
4. **IAM User/Role**: For Raspberry Pi permissions

### Deployment

1. **Deploy the CloudFormation stack:**
   ```bash
   aws cloudformation deploy \
     --template-file ../infrastructure/cloudformation.yaml \
     --stack-name amplitude-noise-monitor \
     --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Get the SNS topic ARN:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name amplitude-noise-monitor \
     --query 'Stacks[0].Outputs[?OutputKey==`SNSTopicArn`].OutputValue' \
     --output text
   ```

3. **Create IAM access keys for the Raspberry Pi user**

## Monitoring and Logs

### View Service Status
```bash
sudo systemctl status amplitude-noise-monitor
```

### View Logs
```bash
sudo journalctl -u amplitude-noise-monitor -f
```

### Manual Start/Stop
```bash
sudo systemctl start amplitude-noise-monitor
sudo systemctl stop amplitude-noise-monitor
sudo systemctl restart amplitude-noise-monitor
```

## Troubleshooting

### Microphone Issues

1. **No sound detected:**
   - Check all connections
   - Verify I2S is enabled: `lsmod | grep snd_soc_i2s`
   - Check microphone orientation
   - Test with: `python3 test_microphone.py`

2. **Permission errors:**
   ```bash
   sudo usermod -a -G audio $USER
   sudo reboot
   ```

3. **Poor audio quality:**
   - Ensure stable power supply
   - Check for interference
   - Verify sample rate settings

### AWS Issues

1. **SNS publish failures:**
   - Check AWS credentials
   - Verify SNS topic ARN
   - Check IAM permissions

2. **DynamoDB connection issues:**
   - Verify Lambda endpoint URL
   - Check network connectivity
   - Verify IAM permissions

### System Issues

1. **Service won't start:**
   ```bash
   sudo systemctl status amplitude-noise-monitor
   sudo journalctl -u amplitude-noise-monitor -n 50
   ```

2. **High CPU usage:**
   - Check if multiple instances are running
   - Monitor with: `htop` or `top`

## Security Considerations

1. **AWS Credentials**: Store securely and rotate regularly
2. **Network Security**: Use VPC and security groups if needed
3. **Physical Security**: Secure the Raspberry Pi and microphone
4. **Data Privacy**: Ensure compliance with local regulations

## Performance Optimization

1. **Reduce sample rate** if needed (e.g., 22050 Hz)
2. **Increase chunk size** for lower CPU usage
3. **Adjust monitoring frequency** based on requirements
4. **Use SSD storage** for better I/O performance

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review system logs
3. Test individual components
4. Verify AWS infrastructure

## License

This project is part of the Amplitude noise monitoring system. 