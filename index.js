// Importing required modules

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


// Initializing the express app

const app = express();
const PORT = process.env.PORT || 3000;
// Configuring the express app

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connecting to MongoDB database

// mongoose.connect("mongodb+srv://anubhavsinghpratihar:Test123@cluster0.ly8vooe.mongodb.net/todolistDB", {useNewUrlParser: true});

mongoose.set("strictQuery", false);
const connectDB = async () => {
try{
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");
} catch (err){
  console.log(err);
  process.exit(1);
}

}

// Creating item schema and model

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

// Creating list schema and model

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// Creating default items for the todo list

const item1 = new Item({
  name: "Welcome to your to_do_list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item.!"
});

const item3 = new Item({
  name: "<~ Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Handling GET request to the home page

app.get("/", async function(req, res) {
  
  try{
  const foundItems = await Item.find({});

   // If there are no items in the database, add the default items

  if (foundItems.length ===0){
    Items: defaultItems;

    try {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved items to DB");
      res.redirect("/");
   }  catch (err) {
      console.log(err);
   }

  } else {

     // If there are items in the database, render the list page

    res.render("list", {listTitle: "Today", newListItems: foundItems});
  } 

  } catch (err) {
    console.log(err);
  }
   
});

// Handling GET request to custom list page

app.get("/:customListName", async function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({name: customListName});
    if (!foundList) {
      
       // If the custom list doesn't exist, create a new list with default items                   

     const list = new List({
      name: customListName,
      items: defaultItems

     });

    list.save();
    res.redirect("/" + customListName);

    } else {
  
      // If the custom list exists, render the list page with its items

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }

  } catch (err) {

    console.log(err);
    
  }
  
});

// Handling POST request to add a new item to the list

app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {

     // If the new item is to be added to the default list, save the item and redirect to the home page

    try {
      await item.save();
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  } else {

     // If the new item is to be added to a custom list, find the list and add the item to it, then redirect to the custom list

    try {
      const foundList = await List.findOne({name: listName});
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  }

});

app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    try {
      const deletedItem = await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted item with ID ${checkedItemId}:", deletedItem);
    } catch (err) {
      console.log(err);
      res.redirect("/");
  }

} else {
  try {
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
    res.redirect("/" + listName);
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
}

});


// // creates a local host server
// // let port = process.env.PORT;
// // if(port === null || port === ""){
// //   port = 3000;
// // }

// app.listen(port, function() {
//   console.log("Server started successfully.");
// });


// app.listen(process.env.PORT || 3000, function(){
//   console.log("Server is running on port 3000");
// }); 



connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Listening on port ${PORT}");
  })

});

