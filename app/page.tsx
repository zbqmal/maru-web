import { redirect } from "next/navigation";

const Home = () => {
  redirect("/diary");
  return null;
};

export default Home;
