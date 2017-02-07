var books = require('../controllers/books');

module.exports = function(express) {
	bookRouter = express.Router();
    bookRouter.use('/:id', books.findById);
    bookRouter.route('/')
        .get(books.getBooks)
        .post(books.addBook);
    bookRouter.route('/:id')
        .get(books.getBookById)
        .put(books.updateBook)
        .delete(books.deleteBook);

    return bookRouter;
}
