# Noise Monitor Demo 🎵

A modern React web application for real-time noise level monitoring with AWS backend infrastructure. Perfect for hackathon demos and property management systems.

## Features ✨

### Mini Demo
- **Real-time Audio Recording**: Capture 5 seconds of audio using Web Audio API
- **Decibel Calculation**: Calculate average noise levels in real-time
- **Visual Feedback**: Color-coded status display (green/yellow/red)
- **Modern UI**: Beautiful, responsive design with animations
- **AWS Integration**: Send data to Lambda function for processing

### Landlord Dashboard
- **Unit Overview**: View all units with real-time status
- **Noise Analytics**: Charts showing noise trends and violations
- **Interactive Cards**: Click units for detailed information
- **Responsive Design**: Works on desktop and mobile devices
- **DynamoDB Integration**: Real data from AWS database

## Tech Stack 🛠️

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Framer Motion** - Smooth animations
- **Recharts** - Beautiful data visualization
- **Lucide React** - Modern icons
- **CSS3** - Custom styling with glassmorphism effects

### Backend
- **AWS Lambda** - Serverless functions
- **API Gateway** - REST API endpoints
- **DynamoDB** - NoSQL database
- **CloudFormation** - Infrastructure as Code

## Quick Start 🚀

### Prerequisites
- Node.js 16+ and npm
- AWS CLI configured with appropriate permissions
- Modern web browser with microphone access

### 1. Clone and Install
```bash
git clone <repository-url>
cd noise-monitor-demo
npm install
```

### 2. Deploy AWS Infrastructure
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```


### 3. Start the Application
```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure 📁

```
noise-monitor-demo/
├── src/
│   ├── components/
│   │   ├── MiniDemo.js          # Audio recording component
│   │   ├── MiniDemo.css         # Mini demo styles
│   │   ├── LandlordView.js      # Dashboard component
│   │   └── LandlordView.css     # Dashboard styles
│   ├── App.js                   # Main app component
│   ├── App.css                  # App styles
│   ├── index.js                 # React entry point
│   └── index.css                # Global styles
├── lambda/
│   ├── index.js                 # Main Lambda function
│   ├── getData.js               # Data retrieval Lambda
│   └── package.json             # Lambda dependencies
├── infrastructure/
│   └── cloudformation.yaml      # AWS infrastructure template
├── public/
│   └── index.html               # HTML template
├── package.json                 # React app dependencies
├── deploy.sh                    # Deployment script
└── README.md                    # This file
```

## API Endpoints 🔌

### POST /noise/process
Process noise level data and store in DynamoDB.

**Request Body:**
```json
{
  "decibelLevel": 65.2,
  "timestamp": "2024-01-15T10:30:00Z",
  "location": "Unit 101",
  "unitId": "101"
}
```

**Response:**
```json
{
  "success": true,
  "status": "warning",
  "message": "Noise level is elevated",
  "decibelLevel": 65.2,
  "timestamp": "2024-01-15T10:30:00Z",
  "recordId": "101-1705312200000"
}
```

### GET /noise/data
Retrieve noise data with optional filtering.

**Query Parameters:**
- `unitId` (optional): Filter by specific unit
- `timeRange` (optional): Time range (1h, 24h, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "timeRange": "24h",
  "overallStats": {
    "totalReadings": 150,
    "averageDecibelLevel": 58.5,
    "totalViolations": 5,
    "totalWarnings": 12
  },
  "unitsStats": [...],
  "rawData": [...]
}
```

## Noise Level Thresholds 📊

| Status | Decibel Range | Color | Description |
|--------|---------------|-------|-------------|
| Acceptable | < 60 dB | 🟢 Green | Normal noise levels |
| Warning | 60-70 dB | 🟡 Yellow | Elevated noise levels |
| Violation | > 70 dB | 🔴 Red | Excessive noise levels |

## AWS Infrastructure 🏗️

The deployment creates:

- **DynamoDB Table**: `noise-monitor-data-dev`
  - Primary key: `id` (string)
  - GSI: `UnitIdIndex` (unitId + createdAt)
  - GSI: `CreatedAtIndex` (createdAt)

- **Lambda Functions**:
  - `noise-monitor-processor-dev`: Processes incoming noise data
  - `noise-monitor-getdata-dev`: Retrieves noise data

- **API Gateway**:
  - REST API with CORS enabled
  - POST /noise/process endpoint
  - GET /noise/data endpoint

- **IAM Roles**: Proper permissions for Lambda to access DynamoDB

## Customization 🎨

### Styling
The app uses a modern glassmorphism design. You can customize colors and styles in:
- `src/index.css` - Global styles
- `src/App.css` - Navigation and layout
- `src/components/MiniDemo.css` - Recording interface
- `src/components/LandlordView.css` - Dashboard styles

### Thresholds
Update noise level thresholds in `lambda/index.js`:
```javascript
const THRESHOLDS = {
  ACCEPTABLE: 60,
  WARNING: 70,
  VIOLATION: 80
};
```

### Units
Modify unit data in `src/components/LandlordView.js`:
```javascript
const dummyUnits = [
  {
    id: '101',
    number: '101',
    tenant: 'John Smith',
    // ... more properties
  }
];
```

## Troubleshooting 🔧

### Common Issues

1. **Microphone Access Denied**
   - Ensure browser has microphone permissions
   - Check HTTPS requirement for microphone access

2. **AWS Deployment Fails**
   - Verify AWS credentials are configured
   - Check IAM permissions for CloudFormation, Lambda, DynamoDB

3. **CORS Errors**
   - API Gateway CORS is configured in CloudFormation
   - Ensure correct API endpoint URL

4. **Lambda Function Errors**
   - Check CloudWatch logs for detailed error messages
   - Verify DynamoDB table exists and permissions are correct

### Debug Mode
Enable console logging in the browser to see detailed information about:
- Audio recording process
- API calls and responses
- Error messages

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

For questions or issues:
1. Check the troubleshooting section
2. Review AWS CloudWatch logs
3. Open an issue on GitHub

---

**Built with ❤️ for hackathon demos and property management solutions** 
