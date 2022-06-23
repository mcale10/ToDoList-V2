const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
require("dotenv").config();


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const srvr = process.env.N1_KEY;
const srvrCred = process.env.N1_SECRET;
let PORT = process.env.PORT || 3000;


mongoose.connect("mongodb+srv://" + srvr + ":" + srvrCred + "@todolist.rlzr7ct.mongodb.net/?retryWrites=true&w=majority");



const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to todolist!"
});

const item2 = new Item({
    name: "Hit + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {
        /*if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved items to database");
                }
            });
            res.redirect("/");*/
        if (err) {
            console.log(err);

        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });
});



app.get("/about", function(req, res) {
    res.render("about");
});


app.post("/newoldlist", function(req, res) {
    const newoldlist = req.body.newoldlist;
    res.redirect("/" + newoldlist);
})

app.get('/:customlistName', function(req, res) {
    const customlistName = _.capitalize(req.params.customlistName);

    List.findOne({ name: customlistName }, function(err, listFound) {
        if (!err) {
            if (!listFound) {
                const list = new List({
                    name: customlistName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customlistName);
            } else {
                res.render('list', { listTitle: listFound.name, newListItems: listFound.items });
            }
        }
    });
});



app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.get("/favicon.ico", function(req, res) {
    res.redirect("/");
});


app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});


app.listen(PORT, function() {
    console.log("Server started on port", PORT);
});