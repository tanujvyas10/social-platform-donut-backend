const app = require('../app')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const HttpStatus = require('http-status-codes')
const request = require('supertest')
const Post = require('../app/models/Post')
const User = require('../app/models/User')
const Comment = require('../app/models/Comment')

const testUserId = new mongoose.Types.ObjectId()
const testPostId = new mongoose.Types.ObjectId()
const testCommentId = new mongoose.Types.ObjectId()
let token = ''

const demoComment = {
  content: 'test comment content',
  userId: testUserId,
  postId: testPostId,
  votes: {
    upVotes: {
      count: 0,
      users: []
    },
    downVotes: {
      count: 0,
      users: []
    }
  }
}

const demoPost = {
  _id: testPostId,
  content: 'test post content',
  userId: testUserId,
  votes: {
    upVotes: {
      count: 0,
      users: []
    },
    downVotes: {
      count: 0,
      users: []
    }
  }
}

const updateComment = {
  content: 'updated comment content'
}

const upvoteComment = {
  content: 'test comment content',
  userId: testUserId,
  votes: {
    upVotes: {
      count: 1,
      users: [
        testUserId
      ]
    },
    downVotes: {
      count: 0,
      users: []
    }
  }
}

const downvoteComment = {
  content: 'test comment content',
  userId: testUserId,
  votes: {
    upVotes: {
      count: 0,
      users: []
    },
    downVotes: {
      count: 1,
      users: [
        testUserId
      ]
    }
  }
}

const testComment = {
  _id: testCommentId,
  ...demoComment
}

const demoUser = {
  name: {
    firstName: 'test',
    lastName: 'test'
  },
  email: 'test3@mailinator.com',
  phone: '1234567890',
  password: 'abc12345',
  info: {
    about: {
      shortDescription: 'this is short description',
      longDescription: 'this is a very long description',
      website: 'https://www.google.com',
      designation: 'software engg',
      skills: [
        'c++',
        'java'
      ],
      education: [{
        school: {
          schoolName: 'firstSchoolName',
          year: '2017-2021'
        }
      },
      {
        school: {
          schoolName: 'secondSchoolName',
          year: '2007-2014'
        }
      }
      ],
      location: 'location'
    }
  }
}

const testUser = {
  _id: testUserId,
  ...demoUser,
  email: 'test@mailinator.com',
  phone: '1234567891',
  tokens: [{
    token: jwt.sign({
      _id: testUserId
    }, process.env.JWT_SECRET)
  }]
}
let server
/**
 * This will pe performed once at the beginning of the test
 */
beforeAll(async (done) => {
  await Comment.deleteMany()
  await new User(testUser).save()
  await new Post(demoPost).save()
  server = app.listen(4000, () => {
    global.agent = request.agent(server)
    done()
  })
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: testUser.email,
      password: testUser.password
    })
  token = response.body.token
  done()
})

/**
 * This deletes all the existing user in database,
 * and creates a new user in database with the provided details.
 */
beforeEach(async () => {
  await Comment.deleteMany()
  await new Comment(testComment).save()
})

/**
 * Testing post creation
 */
test('Should create new comment', async (done) => {
  const response = await request(app)
    .post('/comment')
    .set('Authorization', `Bearer ${token}`)
    .send(demoComment)
    .expect(HttpStatus.CREATED)

  // Assert that db was changed
  const comment = await Comment.findById(response.body.comment._id)
  expect(comment).not.toBeNull()

  const userId = response.body.comment.userId
  const postId = response.body.comment.postId

  // Assertions about the response
  expect(response.body).toMatchObject({
    comment: {
      content: demoComment.content,
      userId: `${userId}`,
      postId: `${postId}`,
      votes: {
        upVotes: {
          count: demoComment.votes.upVotes.count,
          users: demoComment.votes.upVotes.users
        },
        downVotes: {
          count: demoComment.votes.downVotes.count,
          users: demoComment.votes.downVotes.users
        }
      }
    }
  })
  done()
})

/**
 * Testing post update
 */
test('Should update the Comment data', async (done) => {
  await request(app)
    .patch(`/comment/${testCommentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send(updateComment)
    .expect(HttpStatus.OK)
  done()
})

/**
 * Testing post deletion
 */

test('Should delete comment', async (done) => {
  await request(app)
    .delete(`/comment/${testCommentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send()
    .expect(HttpStatus.OK)

  // Assert that post was deleted
  const comment = await Comment.findById(testPostId)
  expect(comment).toBeNull()
  done()
})

/**
 * Testing GET comment for Post
 */

test('Should get comment for post', async (done) => {
  await request(app)
    .get(`/comment/${testPostId}`)
    .set('Authorization', `Bearer ${token}`)
    .send()
    .expect(HttpStatus.OK)
  done()
})

/**
 * Testing upvote post
 */

test('Should upvote the comment', async (done) => {
  const response = await request(app)
    .put(`/comment/upvote/${testCommentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send()
    .expect(HttpStatus.OK)

  const userId = response.body.comment.userId
  const postId = response.body.comment.postId

  expect(response.body).toMatchObject({
    comment: {
      content: upvoteComment.content,
      userId: `${userId}`,
      postId: `${postId}`,
      votes: {
        upVotes: {
          count: upvoteComment.votes.upVotes.count,
          users: response.body.comment.votes.upVotes.users
        },
        downVotes: {
          count: upvoteComment.votes.downVotes.count,
          users: upvoteComment.votes.downVotes.users
        }
      }
    }
  })
  done()
})

/**
 * Testing downvote post
 */

test('Should downvote the post', async (done) => {
  const response = await request(app)
    .put(`/comment/downvote/${testCommentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send()
    .expect(HttpStatus.OK)

  const userId = response.body.comment.userId
  const postId = response.body.comment.postId

  expect(response.body).toMatchObject({
    comment: {
      content: downvoteComment.content,
      userId: `${userId}`,
      postId: `${postId}`,
      votes: {
        upVotes: {
          count: downvoteComment.votes.upVotes.count,
          users: downvoteComment.votes.upVotes.users
        },
        downVotes: {
          count: downvoteComment.votes.downVotes.count,
          users: response.body.comment.votes.downVotes.users
        }
      }
    }
  })
  done()
})

/**
 * TODO: FIX ERROR
 * This is a temporary fix to issue:
 * Jest has detected the following 1 open handle potentially keeping Jest from exiting
 */
afterAll(async () => {
  // close server
  await server.close()
  // delete all the posts post testing
  await Comment.deleteMany()
  // Closing the DB connection allows Jest to exit successfully.
  await mongoose.connection.close()
})
