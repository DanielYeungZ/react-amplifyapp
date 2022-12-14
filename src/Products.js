import React, {useState, useEffect} from "react";
import './App.css';
import "@aws-amplify/ui-react/styles.css";
import omitEmpty from 'omit-empty'
import {API, Storage} from "aws-amplify";

import {
    Button,
    Flex,
    Heading,
    Text,
    TextField,
    View,
    withAuthenticator,
    Table, TableCell, TableRow,
    Pagination
} from "@aws-amplify/ui-react";
import {
    listProducts,
    productsByDate as productsGQLByDate,
    productsByName as productsGQLBYName
} from "./graphql/queries";

import {
    createProduct as createGQLProduct,
    deleteProduct as deleteGQLProduct,
    updateProduct as updateGQLProduct,
    createOrder as createGQLOrder
} from "./graphql/mutations";


const Products = ({signOut}) => {
    const [products, setProducts] = useState([]);
    const [order, setOrder] = useState(null);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [currentPageIndex, setCurrentPageIndex] = React.useState(1);
    const totalPages = Math.ceil(products.length / 10);


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
        fetchProducts();
    }, []);

    const fetchProducts = async (query = productsGQLByDate, filterOptions = {
        type: 'product',
        sortDirection: 'DESC',
        limit: 100
    }) => {

        const apiData = await API.graphql({query: query, variables: filterOptions});

        const data = apiData.data.productsByDate || apiData.data.productsByName;
        const products = data.items
        await Promise.all(
            products.map(async (note) => {
                if (note.image) {
                    const url = await Storage.get(note.name);
                    note.image = url;
                }
                return note;
            })
        );
        setProducts(products);
    }

    async function createProduct(event) {
        event.preventDefault();
        const form = new FormData(event.target);
        const data = {
            name: form.get("name"),
            description: form.get("description"),
            image: form.get("image"),
            price: form.get("price"),
            quantity: form.get("quantity"),
            type: 'product'
        };
        await API.graphql({
            query: createGQLProduct,
            variables: {input: data},
        });
        fetchProducts();
        event.target.reset();
    }

    const removeProduct = async ({id}) => {
        await API.graphql({
            query: deleteGQLProduct,
            variables: {input: {id}},
        });
        fetchProducts();
    }

    const editProduct = async (event) => {
        event.preventDefault();
        const form = new FormData(event.target);
        const data = {
            name: form.get("name"),
            description: form.get("description"),
            price: form.get("price"),
            quantity: form.get("quantity"),
        };
        await API.graphql({
            query: updateGQLProduct,
            variables: {
                input: omitEmpty({
                    id: currentProduct.id,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    quantity: data.quantity,
                })
            },
        });
        setCurrentProduct(null)
        fetchProducts();
        event.target.reset();
    }

    const updateProduct = async (product) => {
        setCurrentProduct(product)
    }

    const searchProduct = async (event) => {
        event.preventDefault();
        const form = new FormData(event.target);
        const data = {
            name: form.get("name"),
            sortDirection: 'DESC',
            limit: 100
        };
        fetchProducts(productsGQLBYName, data);
        event.target.reset();
    }

    const reset = async (event) => {
        setCurrentProduct(null)
        setOrder(null)
        event.target.reset();
    }

    async function createOrder(event) {
        event.preventDefault();
        const form = new FormData(event.target);
        const data = {
            productID: order.id,
            productName: order.name,
            quantity: form.get("quantity"),
            type: 'order',
            status: 'PROCESSING'
        };
        console.log(data)
        await API.graphql({
            query: createGQLOrder,
            variables: {input: data},
        });
        setOrder(null)
        event.target.reset();
    }

    return (
        <View className="App">
            <Heading level={1}>Products Page</Heading>

            <View as="form" margin="3rem 0"
                  onSubmit={currentProduct ? editProduct : createProduct}
                  onReset={reset}
            >
                <Flex direction="row" justifyContent="center">
                    <TextField
                        name="name"
                        placeholder="Product Name"
                        label={currentProduct ? "Product Name(readOnly)" : "Product Name"}
                        variation="quiet"
                        required
                        value={currentProduct ? currentProduct.name : null}
                        disabled={order ? true : false}
                        readOnly={currentProduct ? true : false}
                    />
                    <TextField
                        name="description"
                        placeholder="description"
                        label="Product description"
                        disabled={order ? true :false}
                        defaultValue={currentProduct ? currentProduct.description : ''}
                        variation="quiet"
                    />
                    <TextField
                        name="price"
                        placeholder="price"
                        label="Product price"
                        variation="quiet"
                        disabled={order ? true :false}
                        defaultValue={currentProduct ? currentProduct.price : ''}
                        required
                    />
                    <TextField
                        name="quantity"
                        placeholder="quantity"
                        label="Product quantity"
                        variation="quiet"
                        disabled={order ? true :false}
                        defaultValue={currentProduct ? currentProduct.quantity : ''}
                        required
                    />
                    <Button disabled={order ? true :false} type="submit" variation="primary">
                        {`${currentProduct ? "Update" : "Create"} Product`}
                    </Button>
                    {currentProduct
                    && (<Button type="reset" variation="secondary">
                        Cancel Update
                    </Button>)}
                </Flex>
            </View>

            <View  as="form" margin="3rem 0" onSubmit={searchProduct}>
                <Flex direction="row" justifyContent="center">
                    <TextField
                        name="name"
                        placeholder="Product Name"
                        label="Product Name"
                        labelHidden
                        variation="quiet"
                        required
                        disabled={order || currentProduct ? true : false}
                    />
                    <Button disabled={order || currentProduct ? true :false} type="submit" variation="primary">
                        Search Product
                    </Button>

                </Flex>
            </View>


            {order && (
                <View as="form" margin="3rem 0"
                      onSubmit={createOrder}
                      onReset={reset}>
                    <Flex direction="row" justifyContent="center">
                        <TextField
                            name="name"
                            placeholder="Product Name"
                            labelHidden
                            variation="quiet"
                            required
                            value={order.name}
                            disabled={true}
                        />
                        <TextField
                            name="quantity"
                            placeholder="Order quantity"
                            label="Product quantity"
                            labelHidden
                            variation="quiet"
                            required
                        />
                        <Button type="submit" variation="primary">
                            Create Order
                        </Button>
                        <Button type="reset" variation="secondary">
                            Cancel Order
                        </Button>
                    </Flex>
                </View>)}


            <Heading level={2}>Current Products</Heading>
            <View margin="3rem 0">
                <Flex direction="column">
                    <Table variation="bordered">
                        <TableRow>
                            <TableCell> No. </TableCell>
                            <TableCell> Name </TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Create Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                        {products
                        && products.slice((currentPageIndex - 1) * 10, (currentPageIndex - 1) * 10 + 10).map((product, index) => {
                            let date = new Date(product.createdAt)
                            return (
                                <TableRow key={product.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.description}</TableCell>
                                    <TableCell>{'$' + product.price}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>{date.toString()}</TableCell>
                                    <TableCell>
                                        <Button variation="primary" onClick={() => updateProduct(product)}>
                                            Update
                                        </Button>
                                        &nbsp;
                                        <Button variation="primary" onClick={() => setOrder(product)}>
                                            Create Order
                                        </Button>
                                        &nbsp;
                                        <Button variation="primary" onClick={() => removeProduct(product)}>
                                            Delete
                                        </Button>
                                    </TableCell>
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
    );
};

export default withAuthenticator(Products);
