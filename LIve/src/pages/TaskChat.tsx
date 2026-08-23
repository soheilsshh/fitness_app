import { lazy, Suspense } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import TaskChatPage from "@/components/TaskChatPage";

const TaskChat = () => {
  const permissions = usePermissions();

  if (permissions.loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  const canCollaborate = permissions.hasPermission("tasks.collaborate") || permissions.hasPermission("tasks.manage");
  
  if (!canCollaborate) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <TaskChatPage permissions={permissions} />;
};

export default TaskChat;

