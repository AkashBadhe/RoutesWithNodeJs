var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var bookModel = new Schema({
    title: { type: String, required:'{PATH} is required!'},
    author: { type: String, required:'{PATH} is required!' },
    genre: { type: String },
    read: { type: Boolean, default: false }
});

var Book = mongoose.model('Book', bookModel);

function createDefaultBooks() {
    Book.find({}).exec(function(err, collection) {
        if (collection.length === 0) {
            Book.create({ 
        		title: 'C# for Sociopaths', 
        		author: 'Akash Badhe', 
        		genre: 'IT', 
        		read: false, 
        	});
        	Book.create({ 
        		title: 'Java for Beginers', 
        		author: 'Suraj Badhe', 
        		genre: 'IT', 
        		read: true, 
        	});
        }
    });
}


exports.createDefaultBooks = createDefaultBooks;
