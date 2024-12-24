const {
  postALesson,
  getAllLessons,
  getSingleLesson,
  deleteALesson,
  updateALesson,
} = require('../controllers/lessonCtrl');

const lessonRouter = require('express').Router();
const { authMiddleware, isAdmin, isBoth } = require('../middleware/authMiddleware');
const rateLimter = require('../middleware/rateLimiter');


lessonRouter.post("/", authMiddleware, isAdmin, isBoth, rateLimter, postALesson);

lessonRouter.get("/all", authMiddleware, isAdmin,  rateLimter, getAllLessons);

lessonRouter.get("/:slug", authMiddleware, isAdmin,  rateLimter, getSingleLesson);

lessonRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateALesson);

lessonRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteALesson);


module.exports = lessonRouter;


