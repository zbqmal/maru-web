import { redirect } from "next/navigation";

const Home = () => {
  redirect("/home");
  return null;
};

export default Home;
