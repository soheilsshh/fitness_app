import NutritionEditorClient from "./_components/NutritionEditorClient";

export default async function NutritionEditorPage({ params }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-white">ویرایشگر برنامه غذایی</h1>
      <NutritionEditorClient studentId={id} />
    </div>
  );
}
