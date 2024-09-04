import express from "express";
import joi from 'joi';
import Todo from '../schemas/todo.schema.js';

const router = express.Router();

const createdTodoSchema = joi.object({
    value: joi.string().min(1).max(50).required(),
});

// /routes/todos.router.js

/** 할 일 생성 API 리팩토링, 에러 처리 **/
router.post('/todos', async (req, res, next) => {
    try {
        // 클라이언트에게 전달받은 데이터를 검증합니다.
        const validateBody = await createTodoSchema.validateAsync(req.body);

        // 클라이언트에게 전달받은 value 데이터를 변수에 저장합니다.
        const { value } = validateBody;

        // Todo모델을 사용해, MongoDB에서 'order' 값이 가장 높은 '해야할 일'을 찾습니다.
        const todoMaxOrder = await Todo.findOne().sort('-order').exec();

        // 'order' 값이 가장 높은 도큐멘트의 1을 추가하거나 없다면, 1을 할당합니다.
        const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

        // Todo모델을 이용해, 새로운 '해야할 일'을 생성합니다.
        const todo = new Todo({ value, order });

        // 생성한 '해야할 일'을 MongoDB에 저장합니다.
        await todo.save();

        return res.status(201).json({ todo });
    } catch (error) {
        next(error);
    }
});

router.get('/todos', async (req, res, next) => {
    const todos = await Todo.find().sort('-order').exec();

    return res.status(200).json({ todos });
});

router.patch('/todos/:todoId', async (req, res, next) => {
    const { todoId } = req.params;
    const { order, done, value } = req.body;

    const currentTodo = await Todo.findById(todoId).exec();
    if (!currentTodo)
        return res
            .status(404)
            .json({ errorMessage: '할일이 존재하지 않습니다.' });

    if (order) {
        const targetTodo = await Todo.findOne({ order }).exec();
        if (targetTodo) {
            targetTodo.order = currentTodo.order;
            await targetTodo.save();
        }

        currentTodo.order = order;
    }

    if (done !== undefined) {
        currentTodo.doneAt = done ? new Date() : null;
    }

    if (value) {
        currentTodo.value = value;
    }

    await currentTodo.save();

    return res.status(200).json({});
});

router.delete('/todos/:todoId', async (req, res, next) => {
    const { todoId } = req.params;

    const todo = await Todo.findById(todoId).exec();
    if (!todo)
        return res
            .status(404)
            .json({ errorMessage: '할일이 존재하지 않습니다.' });

    await Todo.deleteOne({ _id: todoId });

    return res.status(200).json({});
});

export default router;
