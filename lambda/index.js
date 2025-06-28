const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'noise-monitor-data';

// Noise level thresholds (in decibels)
const THRESHOLDS = {
    ACCEPTABLE: 60,
    WARNING: 70,
    VIOLATION: 80
};

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const { decibelLevel, timestamp, location, unitId } = body;

        // Validate input
        if (!decibelLevel || typeof decibelLevel !== 'number') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Invalid decibel level provided'
                })
            };
        }

        // Determine status based on decibel level
        let status, message;
        if (decibelLevel <= THRESHOLDS.ACCEPTABLE) {
            status = 'acceptable';
            message = 'Noise level is acceptable';
        } else if (decibelLevel <= THRESHOLDS.WARNING) {
            status = 'warning';
            message = 'Noise level is elevated';
        } else {
            status = 'violation';
            message = 'Noise level exceeds threshold!';
        }

        // Create record for DynamoDB
        const record = {
            id: `${unitId || 'demo'}-${Date.now()}`,
            unitId: unitId || 'demo',
            decibelLevel: decibelLevel,
            status: status,
            timestamp: timestamp || new Date().toISOString(),
            location: location || 'Unknown',
            createdAt: new Date().toISOString()
        };

        // Store in DynamoDB
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: record
        }).promise();

        console.log('Record stored in DynamoDB:', record);

        // Return response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                status: status,
                message: message,
                decibelLevel: decibelLevel,
                timestamp: record.timestamp,
                recordId: record.id
            })
        };

    } catch (error) {
        console.error('Error processing request:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

// Handle OPTIONS requests for CORS
exports.optionsHandler = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: ''
    };
}; 