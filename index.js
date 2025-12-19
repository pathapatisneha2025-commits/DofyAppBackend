const express = require("express");
const cors = require("cors");
const Customers = require("./routes/Customer");
const DofyDudes= require("./routes/dofydudes");




require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/customer", Customers);
app.use("/dofydudes", DofyDudes);




app.listen(5000, () => {
  console.log("Server running on port 5000");
});
