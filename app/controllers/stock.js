/**
 * Created by Sorikairo on 2/15/2017.
 */

var express = require('express');
var Stock = require("../models/stock");

var app = express();

var router = express.Router();


router.get("/:id", function (req, res) {
    Utils.checkToken(req, res, false).then(function(result) {
        if (!result)
            return Utils.sendUnauthorized(req, res);
        if (req.params.id) {
            Stock.findOne({_id: req.params.id}).populate(["ingredients"]).sort('').exec(function (err, stock) {
                if (err) {
                    return res.status(500).send({
                        success: false,
                        message: 'Problem when getting the stock.'
                    });
                }
                else {

                    return res.json({status: "OK", result: stock});
                }
            });
        }
        else if (req.query.by_user_id) {
            Stock.findOne({user: req.query.id}).populate(["ingredients.food"]).sort('').exec(function (err, stock) {
                if (err) {
                    return res.status(500).send({
                        success: false,
                        message: 'Problem when getting the stock.'
                    });
                }
                else {

                    return res.json({status: "OK", result: stock});
                }
            });
        }
        else {
            Stock.find({}).populate(["ingredients"]).sort('').exec(function (err, stocks) {
                if (err) {
                    return res.status(500).send({
                        success: false,
                        message: 'Problem when getting the stock list.'
                    });
                }
                else
                    res.json({status: "OK", result: stocks});
            });
        }
    })
});

router.post("/", function (req, res) {

    var newStock = new Stock(req.body.stock);
    // save the sample stock
    newStock.save(function (err) {
        if (err) throw err;

        stock = newStock;

        return res.json({
            status: "OK",
            result: stock,
            status: 200
        });
    });
});


router.put("/", function (req, res) {
    Utils.checkToken(req, res, false).then(function(result) {
        if (!result)
            return Utils.sendUnauthorized(req, res);
        if (req.body.id) {
            Stock.findOne({
                _id: req.body.id
            }, function (err, stock) {
                if (err) throw err;

                if (stock) {
                    stock.ingredients = req.body.stock.ingredients;
                    stock.save(function (err) {
                        if (err) return res.status(500).send({success: false, message: err});

                        return res.json({
                            status: "OK",
                            result: stock,
                            status: 200
                        });
                    });
                }
                else
                    res.status(203).send({
                        success: false,
                        errorCode: "noMatchingId",
                        message: "no stock with this id"
                    });
            });
        }
    });
});


router.delete("/", function (req, res) {
    Utils.checkToken(req, res, false).then(function(result) {
        if (!result)
            return Utils.sendUnauthorized(req, res);
        if (req.body.id) {
            Stock.find({_id: req.body.id}).remove().exec(function (err) {
                if (err) throw err;
                res.status(200).send({status: "OK"});
            });
        }
    })
});

module.exports = router;