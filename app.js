const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const {buildSchema} = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/Event');
const User = require('./models/User');

const app = express();

app.use(bodyParser.json());

app.use('/api', graphqlHttp({
    schema: buildSchema(`
    type Event {
        _id: ID!
        title: String!
        description: String!
        price: Float!
        date: String!
    }

    type User {
        _id: ID!
        email: String!
        password: String
    }

    input EventInput {
        title: String!
        description: String!
        price: Float!
        date: String!
    }

    input UserInput {
        email: String!
        password: String!
    }

    type RootQuery {
        events: [Event!]!
    }   
    
    type RootMutation {
        createEvent(eventInput: EventInput): Event
        createUser(userInput: UserInput): User
    }
    
    schema {
            query: RootQuery 
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find().then(events => {
                return events.map(event => {
                    return {...event._doc, _id: event._doc._id.toString()}
                })
            }).catch(err => {
                throw err;
            })
        },
        createEvent: args => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: args.eventInput.date,
                creator: '1'
            });
            let createdEvent;
            return event.save().then(res => {
                createdEvent = {...result.doc, _id: result._doc._id.toString()}
                return User.findById('1')
                console.log(res);
            }).then(user => {
                if(!user) {
                    throw new Error('User Not Found.')
                }
                user.createdEvents.push(event);
                return user.save();
            }).then(res => {
                return createdEvent;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
        },
        createUser: args => {
            return User.findOne({email: args.userInput.email}).then(user => {
                if(user) {
                    throw new Error('User exists.')
                }
                return bcrypt.hash(args.userInput.password, 12)
            }).then(hashedPassword => {
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword
                });
                    return user.save();
                }).then(res => {
                    return {...result._doc, password: null, _id: res.id};
                })
                .catch(err => {
                    throw err
                }
            )
        }
    },
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-rs8h1.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`)
    .then(() => {
        app.listen(3300);
    }).catch(err => {
        console.log(err);
    });