import { TodosAccess } from './dataLayer/todosAcess'
import { AttachmentUtils } from './dataLayer/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

// TODO: Implement businessLogic
const logger = createLogger("TodosAccess")
const attachmentUtils  = new AttachmentUtils()
const todosAccess = new TodosAccess()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info(`Retrieving all todos for user ${userId}`, { userId })

    return await todosAccess.getAllTodos(userId)
}

export async function createTodo(newTodo: CreateTodoRequest, userId: string) : Promise<TodoItem> {
  logger.info("Create todo function called")

  const todoId = uuid.v4();
  const createdAt = new Date().toISOString()
  const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
  const newItem = {
    userId,
    todoId,
    createdAt,
    done: false,
    attachmentUrl: s3AttachmentUrl,
    ...newTodo
  }
  return await todosAccess.createTodoItem(newItem)
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest) {
    logger.info(`Updating todo ${todoId} for user ${userId}`, { userId, todoId, todoUpdate: updateTodoRequest })

    const item = await todosAccess.getTodoItem(userId, todoId)

    if (!item)
        throw createError(404, "Todo item not found!")

    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
        throw createError(403, "User is not authorized to update item")
    }

    todosAccess.updateTodoItem(userId, todoId, updateTodoRequest as TodoUpdate)
}

export async function deleteTodo(userId: string, todoId: string) {
    logger.info(`Deleting todo ${todoId} for user ${userId}`, { userId, todoId })

    const item = await todosAccess.getTodoItem(userId, todoId)

    if (!item)
        throw createError(404, "Todo item not found!")

    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to delete todo ${todoId}`)
        throw createError(403, "User is not authorized to delete item!")
    }

    todosAccess.deleteTodoItem(userId, todoId)
}

export async function updateAttachmentUrl(userId: string, todoId: string, attachmentId: string) {
    logger.info(`Generating attachment URL for attachment ${attachmentId}`)

    const attachmentUrl = attachmentUtils.getAttachmentUrl(attachmentId)

    logger.info(`Updating todo ${todoId} with attachment URL ${attachmentUrl}`, { userId, todoId })

    const item = await todosAccess.getTodoItem(userId, todoId)

    if (!item)
        throw createError(404, "Todo item not found!")

    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
        throw createError(403, "User is not authorized to update item!")
    }

    await todosAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)
}

export async function createAttachmentPresignedUrl(attachmentId: string): Promise<string> {
    logger.info(`Generating upload URL for attachment ${attachmentId}`)

    const uploadUrl = attachmentUtils.getUploadUrl(attachmentId)

    return uploadUrl
}
