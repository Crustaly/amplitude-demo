#!/bin/bash

echo "Setting up AWS credentials for Amplitude Noise Monitor..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Create AWS credentials directory
mkdir -p ~/.aws

# Prompt for AWS credentials
echo "Please enter your AWS credentials:"
read -p "AWS Access Key ID: " aws_access_key_id
read -s -p "AWS Secret Access Key: " aws_secret_access_key
echo
read -p "AWS Region (default: us-east-1): " aws_region
aws_region=${aws_region:-us-east-1}

# Create AWS credentials file
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = $aws_access_key_id
aws_secret_access_key = $aws_secret_access_key
EOF

# Create AWS config file
cat > ~/.aws/config << EOF
[default]
region = $aws_region
output = json
EOF

# Set proper permissions
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config

# Test AWS connection
echo "Testing AWS connection..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials configured successfully!"
    aws sts get-caller-identity
else
    echo "❌ AWS credentials test failed. Please check your credentials."
    exit 1
fi

# Get SNS topic ARN
echo "Please enter your SNS topic ARN:"
read -p "SNS Topic ARN: " sns_topic_arn

# Get Lambda endpoint
echo "Please enter your Lambda endpoint:"
read -p "Lambda Endpoint: " lambda_endpoint

# Update config.json with AWS credentials
echo "Updating config.json..."
cat > config.json << EOF
{
  "device": {
    "id": "raspberry_pi_001",
    "name": "Amplitude Noise Monitor",
    "location": "Apartment 101"
  },
  "aws": {
    "access_key_id": "$aws_access_key_id",
    "secret_access_key": "$aws_secret_access_key",
    "region": "$aws_region",
    "sns_topic_arn": "$sns_topic_arn",
    "lambda_endpoint": "$lambda_endpoint"
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
EOF

echo "✅ AWS setup complete!"
echo "Configuration saved to config.json"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x setup.sh"
echo "2. Run: ./setup.sh"
echo "3. Test the microphone: python3 test_microphone.py"
echo "4. Start monitoring: python3 noise_monitor.py" 