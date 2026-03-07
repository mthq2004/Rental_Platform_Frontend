import { Suspense } from "react";
import { Spin } from "antd";
import CreatePostForm from "@/components/property/CreatePostForm";

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spin size="large" /></div>}>
      <CreatePostForm />
    </Suspense>
  );
}