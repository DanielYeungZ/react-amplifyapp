const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient({region: "us-east-1"});
const orderARN = "arn:aws:dynamodb:us-east-1:659623045881:table/Order-sutffwtm3fa5hbynk5wwjbt5we-staging/stream/2022-10-08T20:19:16.786"
const productTable = "roduct-sutffwtm3fa5hbynk5wwjbt5we-stagin"
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    for (let record of event.Records) {
        console.log(record);
        console.log(record.eventName);
        console.log('DynamoDB Record: %j', record.dynamodb);


        if (record.eventName === "MODIFY" && record.eventSourceARN === orderARN) {
            let newRecord = record.dynamodb.NewImage;
            let oldRecord = record.dynamodb.OldImage;
            if (newRecord.status && newRecord.status.S === 'DELIVERED' && oldRecord.status  &&oldRecord.status.S!== 'DELIVERED') {
                const params = {
                    TableName: productTable,
                    Key: {id: newRecord.productID},
                };
                const product = await ddb.get(params).promise();
                console.log("Product : ", product.Item)


                const updateParams = {
                    TableName: productTable,
                    Key: {
                        id: newRecord.id,
                    },
                    UpdateExpression: "set quantity = :quantity",
                    ExpressionAttributeValues: {
                        ":quantity": 100,
                    },
                    ReturnValues: "UPDATED_NEW",
                };
                // let order = await ddb.update(updateParams).promise();
            }
        }

    }
    return Promise.resolve('Successfully processed DynamoDB record');
};
