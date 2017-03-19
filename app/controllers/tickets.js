// Import entities
var Ticket = require('../models/ticket');

// Import Modules
var Promise = require('bluebird');
var express = require('express');

var Utils = require('../utils');
var Constants = require('../constants');

var router = express.Router();

router.post("/", function(req, res) {
    var ticket = new Ticket();

    Utils.checkToken(req, res, true).then(function(result) {
	if (result) {
	    Utils.sendUnauthorized(req, res);
	    return;
	}
	var missing = Utils.checkFields(req.body, ["user", "products", "supermarket", "price", "barcode"]);
	if (missing.length != 0)
	    return res.send({message: Utils.Constants._MSG_ARGS_, details: "Missing followwing properties : " + missing, code: Utils.Constants._CODE_ARGS_});
	ticket.user = req.body.user;
	ticket.products = req.body.products;
	ticket.supermarket = req.body.supermarket;
	ticket.price = req.body.price;
	ticket.barcode = req.body.barcode;
	ticket.timelines_id = [];;

	ticket.save(function(err) {
	    if (err)
		return Utils.sendError(res, err);
	    res.json({message: Utils.Constants._MSG_CREATED_, details: ticket, code: Utils.Constants._CODE_CREATED_});
	});
    });
});

/* router.put */

router.get("/", function(req, res) {
    Utils.checkToken(req, res, true).then(function(result) {
	if (!result)
	    return Utils.sendUnauthorized(req, res);
	ticket.find({}, function(err, tickets) {
	    if (err)
		return Utils.sendError(res, err);
	    res.json({message: Utils.Constants._MSG_OK_, details: tickets, code: Utils.Constants._CODE_OK_});
	});
    });
});

router.delete("/:id", function(req, res) {
    Utils.checkToken(req, res, true).then(function(result) {
	if (!result)
	    return Utils.sendUnauthorized(req, res);
	ticket.remove({_id: req.params.ticket_id}, function(err, ticket) {
	    if (err)
		return Utils.sendError(res, err);
	    res.json({message: Utils.Constants._MSG_DELETED_, details: ticket, code: Utils.Constants._CODE_DELETED_});
	});
    });
});

module.exports = router;
