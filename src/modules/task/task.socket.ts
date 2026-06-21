import { Server, Socket } from "socket.io";

export const initializeTaskSocket = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    socket.on("join_tasks", ({ role, employeeId }: { role: string; employeeId?: string }) => {
      if (role === "owner") {
        socket.join("owner_tasks");
        console.log(`🔌 Socket ${socket.id} joined owner_tasks room`);
      } else if (role === "employee" && employeeId) {
        socket.join(`employee_${employeeId}`);
        console.log(`🔌 Socket ${socket.id} joined employee_${employeeId} room`);
      }
    });
  });
};

export const emitTaskUpdated = (io: Server, task: any, isDelete = false): void => {
  io.to("owner_tasks").emit("task_updated", { task, isDelete });
  if (task.assignedTo) {
    io.to(`employee_${task.assignedTo}`).emit("task_updated", { task, isDelete });
  }
};
