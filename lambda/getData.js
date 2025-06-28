const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'noise-monitor-data';

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const { unitId, timeRange = '24h' } = event.queryStringParameters || {};

        // Calculate time range
        const now = new Date();
        let startTime;

        switch (timeRange) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        // Build query parameters
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: 'createdAt >= :startTime',
            ExpressionAttributeValues: {
                ':startTime': startTime.toISOString()
            }
        };

        // Add unit filter if specified
        if (unitId) {
            params.FilterExpression += ' AND unitId = :unitId';
            params.ExpressionAttributeValues[':unitId'] = unitId;
        }

        // Query DynamoDB
        const result = await dynamodb.scan(params).promise();

        // Process and aggregate data
        const data = result.Items || [];

        // Group by unit
        const unitsData = {};
        data.forEach(item => {
            if (!unitsData[item.unitId]) {
                unitsData[item.unitId] = [];
            }
            unitsData[item.unitId].push(item);
        });

        // Calculate statistics for each unit
        const unitsStats = Object.keys(unitsData).map(unitId => {
            const unitData = unitsData[unitId];
            const decibelLevels = unitData.map(item => item.decibelLevel);
            const violations = unitData.filter(item => item.status === 'violation').length;
            const warnings = unitData.filter(item => item.status === 'warning').length;

            return {
                unitId,
                totalReadings: unitData.length,
                averageDecibelLevel: decibelLevels.length > 0 ?
                    decibelLevels.reduce((a, b) => a + b, 0) / decibelLevels.length : 0,
                maxDecibelLevel: Math.max(...decibelLevels, 0),
                minDecibelLevel: Math.min(...decibelLevels, 0),
                violations,
                warnings,
                lastReading: unitData.length > 0 ? unitData[unitData.length - 1] : null,
                recentData: unitData.slice(-10) // Last 10 readings
            };
        });

        // Calculate overall statistics
        const allDecibelLevels = data.map(item => item.decibelLevel);
        const overallStats = {
            totalReadings: data.length,
            averageDecibelLevel: allDecibelLevels.length > 0 ?
                allDecibelLevels.reduce((a, b) => a + b, 0) / allDecibelLevels.length : 0,
            maxDecibelLevel: Math.max(...allDecibelLevels, 0),
            minDecibelLevel: Math.min(...allDecibelLevels, 0),
            totalViolations: data.filter(item => item.status === 'violation').length,
            totalWarnings: data.filter(item => item.status === 'warning').length,
            totalAcceptable: data.filter(item => item.status === 'acceptable').length
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                timeRange,
                overallStats,
                unitsStats,
                rawData: data.slice(-50) // Last 50 readings for charts
            })
        };

    } catch (error) {
        console.error('Error retrieving data:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
}; 