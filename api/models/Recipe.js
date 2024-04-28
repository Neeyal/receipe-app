import mongoose from 'mongoose';

const recipeSchema = mongoose.Schema({
    recipeName: {
        type    : String,
        index   : true
    },
    category: {
        type    : String
    },
    cookingInstructions: {
        type    : String
    },
    ingredients: {
        type    : String
    },
    rating: {
        type    : [String]
    },
    reviews: {
        type    : [String]
    }
});

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;