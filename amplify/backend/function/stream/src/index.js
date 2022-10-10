const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient({region: "us-east-1"});
const orderARN = "arn:aws:dynamodb:us-east-1:659623045881:table/Order-sutffwtm3fa5hbynk5wwjbt5we-staging/stream/2022-10-08T20:19:16.786"
const productTable = "roduct-sutffwtm3fa5hbynk5wwjbt5we-stagin"
const {parseDynamoStreamRecord} = require("dynamo-stream-record-parser");
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    for (let record of event.Records) {
        console.log(record.eventID);
        console.log(record.eventName);
        console.log('DynamoDB Record: %j', record.dynamodb);


        if (record.eventName === "MODIFY" && record.eventSourceARN === orderARN) {
            const parsedStreamRecord = parseDynamoStreamRecord(record);
            console.log('parsedStreamRecord: ', parsedStreamRecord)
            let newRecord = parsedStreamRecord.dynamodb.NewImage;
            let oldRecord = parsedStreamRecord.dynamodb.OldImage;
            if (newRecord.status === 'DELIVERED' && oldRecord.status !== 'DELIVERED') {
                const params = {
                    TableName: process.env.TALENT_CAMPAIGN_TABLE,
                    Key: {id: newRecord.productID},
                };

                console.log(`[models/campaign] getById: ${JSON.stringify(params, null, 2)}`);

                const product = await ddb.get(params).promise();
                console.log("Product : ", product.Item)


                const updateParams = {
                    TableName: productTable,
                    Key: {
                        id: newRecord.id,
                    },
                    UpdateExpression: "set quantity = :quantity",
                    // This expression is what updates the item attribute
                    ExpressionAttributeValues: {
                        ":quantity": 100,
                    },
                    ReturnValues: "UPDATED_NEW",
                };
                let order = await ddb.update(updateParams).promise();
            }
        }

    }
    return Promise.resolve('Successfully processed DynamoDB record');
};
