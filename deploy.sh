#!/bin/bash

# Noise Monitor Deployment Script
# This script deploys the complete infrastructure to AWS

set -e

# Configuration
STACK_NAME="noise-monitor-stack"
ENVIRONMENT="dev"
REGION="us-east-1"
LAMBDA_DIR="lambda"
INFRASTRUCTURE_DIR="infrastructure"

echo "🚀 Starting Noise Monitor deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS credentials verified"

# Create deployment package for Lambda functions
echo "📦 Creating Lambda deployment packages..."

# Create temp directory for packaging
mkdir -p temp

# Package the main Lambda function
echo "📦 Packaging noise-monitor-processor Lambda..."
cd $LAMBDA_DIR
npm install --production
zip -r ../temp/noise-monitor-processor.zip index.js package.json node_modules/
cd ..

# Package the getData Lambda function
echo "📦 Packaging noise-monitor-getdata Lambda..."
cd $LAMBDA_DIR
zip -r ../temp/noise-monitor-getdata.zip getData.js package.json node_modules/
cd ..

# Package the getUser Lambda function
echo "📦 Packaging get-user Lambda..."
cd $LAMBDA_DIR
zip -r ../temp/get-user.zip getUser.js package.json node_modules/
cd ..

echo "✅ Lambda packages created"

# Deploy CloudFormation stack
echo "☁️ Deploying CloudFormation stack..."

aws cloudformation deploy \
    --template-file $INFRASTRUCTURE_DIR/cloudformation.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

echo "✅ CloudFormation stack deployed"

# Get stack outputs
echo "📋 Getting stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

PROCESS_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ProcessEndpoint`].OutputValue' \
    --output text)

GET_DATA_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`GetDataEndpoint`].OutputValue' \
    --output text)

GET_USER_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`GetUserEndpoint`].OutputValue' \
    --output text)

DYNAMODB_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
    --output text)

echo "✅ Stack outputs retrieved"

# Update Lambda functions with actual code
echo "🔄 Updating Lambda functions with actual code..."

# Update the processor Lambda
aws lambda update-function-code \
    --function-name noise-monitor-processor-$ENVIRONMENT \
    --zip-file fileb://temp/noise-monitor-processor.zip \
    --region $REGION

# Update the getData Lambda
aws lambda update-function-code \
    --function-name noise-monitor-getdata-$ENVIRONMENT \
    --zip-file fileb://temp/noise-monitor-getdata.zip \
    --region $REGION

# Update the getUser Lambda
aws lambda update-function-code \
    --function-name get-user-$ENVIRONMENT \
    --zip-file fileb://temp/get-user.zip \
    --region $REGION

echo "✅ Lambda functions updated"

# Clean up temp files
rm -rf temp

# Display deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Information:"
echo "   Stack Name: $STACK_NAME"
echo "   Environment: $ENVIRONMENT"
echo "   Region: $REGION"
echo ""
echo "🔗 API Endpoints:"
echo "   Base URL: $API_URL"
echo "   Process Endpoint: $PROCESS_ENDPOINT"
echo "   Get Data Endpoint: $GET_DATA_ENDPOINT"
echo "   Get User Endpoint: $GET_USER_ENDPOINT"
echo ""
echo "🗄️ DynamoDB Tables:"
echo "   Noise Monitor: $DYNAMODB_TABLE"
echo "   Users: Users-$ENVIRONMENT"
echo ""
echo "📝 Next Steps:"
echo "   1. Update the API endpoint in src/components/MiniDemo.js"
echo "   2. Run 'npm install' in the root directory"
echo "   3. Run 'npm start' to start the React app"
echo ""
echo "🔧 To update the API endpoint, replace 'YOUR_API_GATEWAY_URL' in MiniDemo.js with:"
echo "   $PROCESS_ENDPOINT"
echo "" 