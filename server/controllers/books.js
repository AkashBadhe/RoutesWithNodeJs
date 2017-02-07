var Book = require('mongoose').model('Book');
var _ = require('lodash');

exports.findById = function(req, res, next) {
    var id = req.params.id;
    console.log('Retrieving book: ' + id);
    Book.findOne({ _id: req.params.id }).exec(function(err, book) {
        if (err)
            res.status(500).send(err);
        else if (book) {
            req.book = book;
            next();
        } else {
            res.status(404).send('No book found');
        }
    });
};
exports.getBookById = function(req, res, next) {
    var id = req.params.id;
    console.log('Retrieving book: ' + id);
    if(req.book){
        res.status(200);
        res.send(req.book);
    }
};

exports.getBooks = function(req, res, next) {
    Book.find({}).exec(function(err, collection) {
        res.send(collection);
    });
};

exports.addBook = function(req, res, next) {
    var book = req.body;
    if (!_.isEmpty(book)) {
        console.log('Adding book: ' + JSON.stringify(book));
        Book.create(book, function(err, user) {
            if (err) {
                res.status(400);
                return res.send({ reason: err.toString() + 'thanku for visiting books.com' });
            } else {
                res.status(201);
                res.send(book);
            }
        });
    } else {
        res.status(400);
        return res.send('Empty object');
    }
}

exports.updateBook = function(req, res, next) {
    var id = req.params.id;
    var book = req.body;
    console.log('Updating book: ' + id);
    console.log(JSON.stringify(book));
    if (req.body._id) {
        delete req.body._id;
    }

    for (var p in book) {
        req.book[p] = book[p];
    }

    req.book.save(function(err) {
        if (err)
            res.status(500).send(err);
        else {
            res.json(req.book);
        }
    });
}

exports.deleteBook = function(req, res, next) {
    var id = req.params.id;
    console.log('Deleting book: ' + id);
    req.book.remove(function(err) {
        if (err)
            res.status(500).send(err);
        else {
            res.status(204).send('Removed');
        }
    });
}
