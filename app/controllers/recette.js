/**
 * Created by Sorikairo on 2/15/2017.
 */

var express = require('express');
var Recipe = require("../models/recipe");

var app = express();

var router = express.Router();


router.get("/:id", function (req, res) {
    Utils.checkToken(req, res, false).then(function(result) {
        if (!result)
            return Utils.sendUnauthorized(req, res);
        if (req.params.id) {
            Recipe.findOne({_id: req.params.id}).populate(["ingredients.food", "category", "steps"]).sort('').exec(function (err, recipe) {
                if (err) {
                    return res.status(500).send({
                        success: false,
                        message: 'Problem when getting the recipe.'
                    });
                }
                else {

                    return res.json({status: "OK", result: recipe});
                }
            });
        }
        else if (req.query.category) {
            Recipe.findOne({category: req.query.category}).populate(["ingredients.food", "category", "steps"]).sort('').exec(function (err, recipe) {
                if (err) {
                    return res.status(500).send({
                        success: false,
                        message: 'Problem when getting the recipe.'
                    });
                }
                else {

                    return res.json({status: "OK", result: recipe});
                }
            });
        }
        else {
            Recipe.find({}).populate(["ingredients.food", "category", "steps"]).sort('').exec(function (err, recipes) {
                if (err) {
                    return res.status(500).send({
                        success: false,
                        message: 'Problem when getting the recipe list.'
                    });
                }
                else
                    res.json({status: "OK", result: recipes});
            });
        }
    })
});

router.post("/", function (req, res) {

    var newRecipe = new Recipe(req.body.recipe);
    // save the sample recipe
    newRecipe.save(function (err) {
        if (err) throw err;

        recipe = newRecipe;

        return res.json({
            status: "OK",
            result: recipe,
            status: 200
        });
    });
});


router.put("/", function (req, res) {
    Utils.checkToken(req, res, false).then(function(result) {
        if (!result)
            return Utils.sendUnauthorized(req, res);
        if (req.body.id) {
            Recipe.findOne({
                _id: req.body.id
            }, function (err, recipe) {
                if (err) throw err;

                if (recipe) {
                    recipe.title = req.body.recipe.title;
                    recipe.description = req.body.recipe.description;
                    recipe.picture = req.body.recipe.picture;
                    recipe.ingredients = req.body.recipe.ingredients;
                    recipe.category = req.body.recipe.category;
                    recipe.steps = req.body.recipe.steps;
                    recipe.save(function (err) {
                        if (err) return res.status(500).send({success: false, message: err});

                        return res.json({
                            status: "OK",
                            result: recipe,
                            status: 200
                        });
                    });
                }
                else
                    res.status(203).send({
                        success: false,
                        errorCode: "noMatchingId",
                        message: "no recipe with this id"
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
            Recipe.find({_id: req.body.id}).remove().exec(function (err) {
                if (err) throw err;
                res.status(200).send({status: "OK"});
            });
        }
    })
});

module.exports = router;