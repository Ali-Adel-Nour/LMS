import {
  createReview
} from '../controllers/reviewCtrl';
import {
  expect
} from 'chai';

describe('createReview', () => {
  it('should create a review', async () => {
    const req = {
      user: {
        _id: 'user123'
      },
      body: {
        rating: 5,
        comment: 'Great course!',
        color: 'blue'
      }
    };

    const res = {};

    await createReview(req, res);

    expect(res.statusCode).to.equal(201);
    expect(res.review).to.have.property('user', 'user123');
    expect(res.review).to.have.property('comment', 'Great course!');
    expect(res.review).to.have.property('color', 'blue');
  });

  it('should return 400 if rating is invalid', async () => {
    const req = {
      user: {
        _id: 'user123'
      },
      body: {
        rating: 'invalid',
        comment: 'Great course!'
      }
    };

    const res = {};

    await createReview(req, res);

    expect(res.statusCode).to.equal(400);
  });

  it('should return 401 if user is not logged in', async () => {
    const req = {
      body: {
        rating: 5,
        comment: 'Great course!'
      }
    };

    const res = {};

    await createReview(req, res);

    expect(res.statusCode).to.equal(401);
  });
});