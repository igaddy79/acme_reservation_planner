const express = require('express');
const {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  createReservation,
  fetchCustomers,
  fetchRestaurants,
  fetchReservations,
  destroyReservation
} = require('./db');

const app = express();
app.use(express.json());

const init = async () => {
  try {
    console.log('Connecting to the database...');
    await client.connect();
    console.log('Connected to the database');

    await createTables();

    const [moe, lucy, larry, ethyl, paris, london, nyc] = await Promise.all([
      createCustomer('moe'),
      createCustomer('lucy'),
      createCustomer('larry'),
      createCustomer('ethyl'),
      createRestaurant('paris'),
      createRestaurant('london'),
      createRestaurant('nyc')
    ]);

    console.log('Sample customers and restaurants created');
    console.log(await fetchCustomers());
    console.log(await fetchRestaurants());

    const [reservation, reservation2] = await Promise.all([
      createReservation({
        customer_id: moe.id,
        restaurant_id: nyc.id,
        departure_date: '2024-02-14'
      }),
      createReservation({
        customer_id: moe.id,
        restaurant_id: nyc.id,
        departure_date: '2024-02-28'
      })
    ]);

    console.log('Sample reservations created');
    console.log(await fetchReservations());

    await destroyReservation({ id: reservation.id, customer_id: reservation.customer_id });
    console.log('Reservations after deletion:', await fetchReservations());

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
      console.log('Example CURL commands to test the endpoints:');
      console.log(`curl localhost:${port}/api/customers`);
      console.log(`curl localhost:${port}/api/restaurants`);
      console.log(`curl localhost:${port}/api/reservations`);
      console.log(`curl -X DELETE localhost:${port}/api/customers/${moe.id}/reservations/${reservation2.id}`);
    });
  } catch (error) {
    console.error('Error initializing app:', error);
  } finally {
    // Close the client after initializing to avoid hanging connections
    await client.end();
  }
};

// Routes
app.get('/api/customers', async (req, res, next) => {
  try {
    res.send(await fetchCustomers());
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/restaurants', async (req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/reservations', async (req, res, next) => {
  try {
    res.send(await fetchReservations());
  } catch (ex) {
    next(ex);
  }
});

app.delete('/api/customers/:customer_id/reservations/:id', async (req, res, next) => {
  try {
    await destroyReservation({ customer_id: req.params.customer_id, id: req.params.id });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

// Start the application
init();


