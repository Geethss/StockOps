import { useEffect, useState } from 'react'
import socket from '@/lib/socket'

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const emit = (event, data) => {
    socket.emit(event, data)
  }

  const on = (event, callback) => {
    socket.on(event, callback)
    return () => socket.off(event, callback)
  }

  const joinRoom = (room) => {
    socket.emit('join_warehouse', { warehouse_id: room })
  }

  const leaveRoom = (room) => {
    socket.emit('leave_warehouse', { warehouse_id: room })
  }

  return {
    isConnected,
    emit,
    on,
    joinRoom,
    leaveRoom,
    socket,
  }
}

