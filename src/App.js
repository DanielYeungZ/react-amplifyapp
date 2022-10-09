import { Link, Flex, Heading } from '@aws-amplify/ui-react';
import './App.css';
import {
    BrowserRouter as Router,
    Link as ReactRouterLink,
    Routes,
    Route,
} from 'react-router-dom';

import Products from './Products'
import Orders from './Orders'


function App() {
    return (
        <Router>
            <Flex>
                <ReactRouterLink to="/" component={Link}><button type="button"> Products </button></ReactRouterLink>
                <ReactRouterLink to="/orders" component={Link}><button type="button">Orders</button></ReactRouterLink>
            </Flex>

            <Routes>
                <Route path="/orders" element={<Orders />} />
                <Route path="/" element={<Products />} />
            </Routes>
        </Router>
    );
}

export default App;
