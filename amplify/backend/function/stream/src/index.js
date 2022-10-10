const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient({region: "us-east-1"});
const orderARN = "arn:aws:dynamodb:us-east-1:659623045881:table/Order-sutffwtm3fa5hbynk5wwjbt5we-staging/stream/2022-10-08T20:19:16.786"
const productTable = "Product-sutffwtm3fa5hbynk5wwjbt5we-staging"
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    for (let record of event.Records) {
        console.log(record.eventSourceARN);
        console.log(record.eventName);
        console.log('DynamoDB Record:', record.dynamodb);

        if (record.eventName === "MODIFY" && record.eventSourceARN === orderARN) {
            let newRecord = record.dynamodb.NewImage;
            let oldRecord = record.dynamodb.OldImage;

            if (newRecord.status && newRecord.status.S === 'DELIVERED' && oldRecord.status  &&oldRecord.status.S!== 'DELIVERED') {
                const params = {
                    TableName: productTable,
                    Key: {id: newRecord.productID.S},
                };
                const product = await ddb.get(params).promise();
                console.log("[delivered] product : ", product.Item)

                let quantity = product.Item.quantity;
                let consume = parseInt(newRecord.quantity.N);
                const final = quantity - consume
                const updateParams = {
                    TableName: productTable,
                    Key: {
                        id: newRecord.productID.S,
                    },
                    UpdateExpression: "set quantity = :quantity",
                    ExpressionAttributeValues: {
                        ":quantity": final,
                    },
                    ReturnValues: "UPDATED_NEW",
                };
                console.log(updateParams)
                 let result = await ddb.update(updateParams).promise();
                console.log("[delivered] result : ", result)
            }
        }

    }
    return Promise.resolve('Successfully processed DynamoDB record');
};
