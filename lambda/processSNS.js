const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // Process SNS messages
        for (const record of event.Records) {
            if (record.EventSource === 'aws:sns') {
                const snsMessage = JSON.parse(record.Sns.Message);
                console.log('Processing SNS message:', snsMessage);

                // Store noise data in DynamoDB
                await storeNoiseData(snsMessage);

                // Send additional notifications if needed
                if (snsMessage.status === 'violation') {
                    await sendViolationAlert(snsMessage);
                }
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'SNS messages processed successfully' })
        };

    } catch (error) {
        console.error('Error processing SNS messages:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process SNS messages' })
        };
    }
};

async function storeNoiseData(data) {
    const timestamp = new Date().toISOString();
    const id = `${data.device_id}_${Date.now()}`;

    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
            id: id,
            unitId: data.device_id,
            decibelLevel: data.decibel_level,
            status: data.status,
            location: data.location,
            timestamp: data.timestamp,
            createdAt: timestamp,
            deviceType: 'raspberry_pi',
            ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
        }
    };

    try {
        await dynamodb.put(params).promise();
        console.log('Noise data stored successfully:', id);
    } catch (error) {
        console.error('Error storing noise data:', error);
        throw error;
    }
}

async function sendViolationAlert(data) {
    const message = {
        severity: 'HIGH',
        type: 'NOISE_VIOLATION',
        deviceId: data.device_id,
        location: data.location,
        decibelLevel: data.decibel_level,
        timestamp: data.timestamp,
        message: `CRITICAL: Noise violation detected at ${data.location}. Level: ${data.decibel_level} dB`
    };

    try {
        // You can add additional notification logic here
        // For example, send to a different SNS topic for urgent alerts
        console.log('Violation alert prepared:', message);
    } catch (error) {
        console.error('Error sending violation alert:', error);
    }
} 