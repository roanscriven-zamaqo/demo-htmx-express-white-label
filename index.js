const express = require('express');
const bodyParser = require('body-parser');
const itemRoutes = require('./app/routes/itemRoutes');
const sequelize = require('./app/model/dbconfig');
const Item = require('./app/model/item');
const path = require('path');
require('dotenv').config();

// automatically creating table on startup
sequelize.sync({ force: true }).then(async () => {
  console.log('db is ready...');
});

// link public folder
const publicDirectory = path.join(__dirname, '/public');

const app = express();
app.use(express.static(publicDirectory));

app.use(express.json());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('view engine', 'pug');
// application routes
app.use('/api', itemRoutes.routes);

app.get('/', async (req, res) => {
  const items = await Item.findAndCountAll();
  return res.render('index', {
  items: items.rows,
  heading: process.env.heading,
  });
});

app.get('/get-item-row/:id', async (req, res) => {
  const id = req.params.id;
  await Item.findOne({ where: { id: id } }).then((item) => {
    return res.send(`<tr>
    <td>${item.tableHead1}</td>
    <td>${item.tableHead2}</td>
    <td>
        <button class="btn btn-primary"
            hx-get="/get-edit-form/${id}">
            Edit
        </button>
    </td>
    <td>
        <button hx-delete="/delete/${id}"
            class="btn btn-primary">
            Delete
        </button>
    </td>
</tr>`);
  });
});

app.get('/get-edit-form/:id', async (req, res) => {
  const id = req.params.id;
  await Item.findOne({ where: { id: id } }).then((item) => {
    return res.send(`<tr hx-trigger='cancel' class='editing' hx-get="/get-item-row/${id}">
    <td><input name="tableHead1" value="${item.tableHead1}"/></td>
    <td><input name="tableHead2" value="${item.tableHead2}"/></td>
    <td>
      <button class="btn btn-primary" hx-get="/get-item-row/${id}">
        Cancel
      </button>
      <button class="btn btn-primary" hx-put="/update/${id}" hx-include="closest tr">
        Save
      </button>
    </td>
  </tr>`);
  });
});

app.put('/update/:id', async (req, res) => {
  const id = req.params.id;
  // update item
  await Item.findByPk(id).then((item) => {
    item
      .update({
        tableHead1: req.body.tableHead1,
        tableHead2: req.body.tableHead2,
      })
      .then(() => {
        return res.send(`<tr>
    <td>${req.body.tableHead1}</td>
    <td>${req.body.tableHead2}</td>
    <td>
        <button class="btn btn-primary"
            hx-get="/get-edit-form/${id}">
            Edit 
        </button>
    </td>
    <td>
        <button hx-delete="/delete/${id}"
            class="btn btn-primary">
            Delete
        </button>
    </td>
</tr>`);
      });
  });
});

app.delete('/delete/:id', async (req, res) => {
  const id = req.params.id;
  await Item.findOne({ where: { id: id } }).then((item) => {
    item.destroy();
    return res.send('');
  });
});

app.post('/submit', async (req, res) => {
  console.log('body - ', req.body);
  const item = {
    tableHead1: req.body.tableHead1,
    tableHead2: req.body.tableHead2,
  };
  await Item.create(item).then((x) => {
    //console.log('id- ', x.null)
    // send id of recently created item
    return res.send(`<tr>
    <td>${req.body.tableHead1}</td>
    <td>${req.body.tableHead2}</td>
    <td>
        <button class="btn btn-primary"
            hx-get="/get-edit-form/${x.null}">
            Edit 
        </button>
    </td>
    <td>
        <button hx-delete="/delete/${x.null}}"
            class="btn btn-primary">
            Delete
        </button>
    </td>
</tr>`);
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Service endpoint = http://localhost:${PORT}`);
});
