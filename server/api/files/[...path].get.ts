// import { getMinioClient } from '~~/server/utils/minio'

import {getMinioClient} from "#server/utils/minio.ts";

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, 'path')

  if (!pathParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Путь к файлу не указан'
    })
  }

  // Склеиваем массив сегментов пути, если передано несколько уровней вложенности
  const filePath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam

  const { client, bucket } = getMinioClient()

  try {
    // 1. Получаем метаданные файла (размер и MIME-тип)
    const stat = await client.statObject(bucket, filePath)

    // 2. Запрашиваем Readable Stream объекта из MinIO
    const stream = await client.getObject(bucket, filePath)

    // 3. Устанавливаем HTTP-заголовки ответа
    setResponseHeaders(event, {
      'Content-Type': stat.metaData['content-type'] || 'application/octet-stream',
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable'
    })

    // 4. Передаем стрим напрямую клиенту
    return sendStream(event, stream)
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }

    // Если файл отсутствует в бакете MinIO
    if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Файл не найден'
      })
    }

    console.error('[MinIO File Serve Error]:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при чтении файла из MinIO'
    })
  }
})
