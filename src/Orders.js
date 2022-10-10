import React, {useState, useEffect} from "react";
import './App.css';
import "@aws-amplify/ui-react/styles.css";
import omitEmpty from 'omit-empty'
import {API} from "aws-amplify";

import {
    Button,
    Flex,
    Heading,
    Text,
    TextField,
    SelectField,
    View,
    withAuthenticator,
    Table, TableCell, TableRow,
    Pagination
} from "@aws-amplify/ui-react";
import {
    ordersByDate as ordersGQLByDate,
    ordersByName as ordersGQLByName
} from "./graphql/queries";

import {
    updateProduct as updateGQLProduct,
    updateOrder as updateGQLOrder,
    deleteOrder as deleteGQLOrder

} from "./graphql/mutations";

const Orders = ({signOut}) => {
    const [orders, setOrders] = useState([]);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [order, setOrder] = useState(null);
    const [currentPageIndex, setCurrentPageIndex] = React.useState(1);
    const totalPages = Math.ceil(orders.length / 10);

    const handleNextPage = () => {
        setCurrentPageIndex(currentPageIndex + 1);
    };
    const handlePreviousPage = () => {
        setCurrentPageIndex(currentPageIndex - 1);
    };
    const handleOnChange = (newPageIndex, prevPageIndex) => {
        setCurrentPageIndex(newPageIndex);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async (query = ordersGQLByDate, filterOptions = {
        type: 'order',
        sortDirection: 'DESC',
        limit: 100
    }) => {
        const apiData = await API.graphql({query: query, variables: filterOptions});
        const data = apiData.data.ordersByDate || apiData.data.ordersByName;
        const orders = data.items
        setOrders(orders);
    }

    const removeOrder = async ({id}) => {
        await API.graphql({
            query: deleteGQLOrder,
            variables: {input: {id}},
        });
        fetchOrders();
    }

    const editOrder = async (event) => {
        event.preventDefault();
        const form = new FormData(event.target);
        const data = omitEmpty({
            id: order.id,
            shipInfo: {
                company: form.get("shipCompany"),
                number: form.get("shipNumber"),
            },
            status: form.get("status"),

        })
        console.log( data)
        await API.graphql({
            query: updateGQLOrder,
            variables: {
                input: data
            },
        });
        setOrder(null)
        fetchOrders();
        event.target.reset();
    }


    const searchOrder = async (event) => {
        event.preventDefault();
        const form = new FormData(event.target);
        const data = {
            productName: form.get("name"),
            sortDirection: 'DESC',
            limit: 100
        };
        fetchOrders(ordersGQLByName, data);
        event.target.reset();
    }

    const reset = async (event) => {
        setOrder(null)
        //event.target.reset();
    }

    return (
        <>
            <View className="App">
                <Heading level={1}>Orders Page</Heading>
                {order && (<View as="form" margin="3rem 0"
                                 onSubmit={editOrder}
                                 onReset={reset}
                >
                    <Flex direction="row" justifyContent="center">
                        <TextField
                            name="name"
                            label="Product Name (readOnly)"
                            variation="quiet"
                            value={order.productName}
                            disabled
                            readOnly
                        />
                        <TextField
                            name="shipCompany"
                            placeholder="Company Name"
                            label="Shipping Company"
                            defaultValue={order.shipInfo && order.shipInfo.company}
                            variation="quiet"
                        />
                        <TextField
                            name="shipNumber"
                            placeholder="Number"
                            label="Tacking Number"
                            variation="quiet"
                            defaultValue={order.shipInfo && order.shipInfo.number}
                        />
                        <SelectField
                            name="status"
                            label="Order status"
                            defaultValue={order.status}
                            required
                        >
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="DELIVERED">DELIVERED</option>
                        </SelectField>
                        <Button type="submit" variation="primary">
                            Update Order
                        </Button>
                        <Button type="reset" variation="secondary">
                            Cancel Update
                        </Button>
                    </Flex>
                </View>)}

                <View as="form" margin="3rem 0" onSubmit={searchOrder}>
                    <Flex direction="row" justifyContent="center">
                        <TextField
                            name="name"
                            placeholder="Product Name"
                            label="Product Name"
                            labelHidden
                            variation="quiet"
                            required
                            disabled={currentProduct ? true : false}
                        />
                        <Button type="submit" variation="primary">
                            Search Order
                        </Button>
                    </Flex>
                </View>

                <Heading level={2}>Current Orders</Heading>
                <View margin="3rem 0">
                    <Flex direction="column">
                        <Table variation="bordered">
                            <TableRow>
                                <TableCell> No. </TableCell>
                                <TableCell> Name </TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Shipping Company</TableCell>
                                <TableCell>Tracking Number</TableCell>
                                <TableCell>Create Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                            {orders
                            && orders.slice((currentPageIndex - 1) * 10, (currentPageIndex - 1) * 10 + 10).map((order, index) => {
                                let date = new Date(order.createdAt)
                                return (
                                    <TableRow key={order.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{order.productName}</TableCell>
                                        <TableCell>{order.quantity}</TableCell>
                                        <TableCell>{order.status}</TableCell>
                                        <TableCell>{order.ShipInfo && order.ShipInfo.company}</TableCell>
                                        <TableCell>{order.ShipInfo && order.ShipInfo.number}</TableCell>
                                        <TableCell>{date.toString()}</TableCell>
                                        <Button variation="primary" onClick={() => setOrder(order)}>
                                            Update
                                        </Button>
                                        &nbsp;
                                        <Button variation="primary" onClick={() => removeOrder(order)}>
                                            Delete
                                        </Button>
                                    </TableRow>
                                )
                            })}
                        </Table>
                    </Flex>
                    <br/>
                    <Pagination
                        currentPage={currentPageIndex}
                        totalPages={totalPages}
                        onNext={handleNextPage}
                        onPrevious={handlePreviousPage}
                        onChange={handleOnChange}
                    />
                </View>
                <Button onClick={signOut}>Sign Out</Button>
            </View>

        </>
    );
};

export default withAuthenticator(Orders);
