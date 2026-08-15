import ProfileForm from "./profile-form";

const ProfilePage = () => {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-1 text-xl font-bold">내 프로필</h1>
      <p className="mb-6 text-sm text-muted-foreground">내 정보를 확인하고 수정할 수 있어요.</p>
      <ProfileForm />
    </div>
  );
};

export default ProfilePage;
