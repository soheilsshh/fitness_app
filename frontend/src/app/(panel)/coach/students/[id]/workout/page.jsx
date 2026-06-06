import WorkoutEditorClient from "./_components/WorkoutEditorClient";

export default async function WorkoutEditorPage({ params }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-white">ویرایشگر برنامه تمرین</h1>
      <WorkoutEditorClient studentId={id} />
    </div>
  );
}
