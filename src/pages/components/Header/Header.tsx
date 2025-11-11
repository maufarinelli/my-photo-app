import { Flex, useAuthenticator } from "@aws-amplify/ui-react";
import { BsArrowLeftCircleFill } from "react-icons/bs";
import Link from "next/link";
import { useRouter } from "next/router";

const Header: React.FC<{ title: string }> = ({ title }) => {
  const router = useRouter();
  const pathname = router.pathname;
  const { signOut } = useAuthenticator((context) => [context.user]);

  return (
    <header style={{ margin: "20px" }}>
      <Flex justifyContent="space-between">
        {pathname !== "/" && (
          <Link
            href="/"
            style={{
              alignSelf: "center",
            }}
          >
            <BsArrowLeftCircleFill size={24} />
          </Link>
        )}
        <h1
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: pathname === "/" ? "24px" : "20px",
            alignSelf: "center",
          }}
        >
          {title}
        </h1>
        <button
          onClick={signOut}
          style={{
            backgroundColor: "##f2f2f2",
            borderColor: "#d6d6d6",
            boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.1)",
            color: "#333",
            borderRadius: "5px",
            padding: "10px",
            alignSelf: "flex-start",
          }}
        >
          Sign out
        </button>
      </Flex>
    </header>
  );
};

export default Header;
