import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from './models/User.js'
import session from 'express-session'
import Recipe from './models/Recipe.js'

const app = express();
const secretkey = 'secretKey'

app.use(bodyParser.json())
app.use(cors())

const uri = 'mongodb://localhost:27017/Recipe'
mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err))

app.use(session({
  secret: secretkey, 
  resave: true,
  saveUninitialized: true
}))

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ email, password: hashedPassword })
    await user.save()
    res.status(201).send('User created successfully')
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      throw new Error('User not found')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new Error('Incorrect password')
    }
    const token = jwt.sign({ userId: user._id }, secretkey, {expiresIn: '1000s'})
    req.session.token = token
    res.send('Sign in successful')
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.post('/logout', (req, res) => {
  req.session.destroy()
  res.send('Logged out successfully')
})

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.session.token
  if (!token) {
    return res.status(401).send('Unauthorized: No token provided')
  }
  jwt.verify(token, secretkey, (err, decoded) => { 
    if (err) {
      return res.status(401).send('Unauthorized: Invalid token')
    }
    req.userId = decoded.userId
    next()
  })
}



app.get('/recipeList', verifyToken, async(req,res) => {
  try{
    const data = await Recipe.find({})
    res.send(data)  
  }
  catch (error) {
    res.status(400).send(error.message)
  }
})

app.put('/updateRecipe/:id', verifyToken, async(req, res) => {
  try{
    const id = req.params.id
    const data = await Recipe.findByIdAndUpdate(id, { cookingInstructions: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' }, { new: true });
    res.send(data)  
  }
  catch (error) {
    res.status(400).send(error.message)
  }
})

app.post('/createRecipe', verifyToken, async (req, res) => {
  try {
    const { recipeName, category, cookingInstructions, ingredients } = req.body
    const recipe = new Recipe({ recipeName, category, cookingInstructions, ingredients })
    await recipe.save()
    res.send(recipe)
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.post(`/:type(rating|reviews)/:recipeId`, verifyToken, async(req, res) => {
  try{
    const id = req.params.recipeId
    const type = req.params.type
    const data = await Recipe.findByIdAndUpdate(id, { $push: { [type] : '2' } }, { new: true });
    res.send(data)
  }
  catch(error){
    res.status(400).send(error.message)
  }
})

app.delete('/:id', verifyToken, async(req, res) => {
try{
  const id = req.params.id
  const data = await Recipe.findByIdAndDelete(id)
  res.send(data)
}
catch(error){
  res.status(400).send(error.message)
}
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
