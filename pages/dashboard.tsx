import React, { useContext, useEffect } from "react";
import { Can } from "../components/Can";

import { AuthContext } from "../context/AuthContext";
import { useCan } from "../hooks/useCan";
import { setupAPIClient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { user, signOut } = useContext(AuthContext);

  const userCanSeeMetrics = useCan({
    permissions: ["metrics.list"],
  });

  useEffect(() => {
    api.get("/me").then((response) => console.log(response));
  }, []);

  return (
    <>
    <button onClick={signOut}>Sign out</button>
    <Can permissions={['metrics.list']}>
      <div>Métricas</div>
      </Can>
    </>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);
  const response = await apiClient.get("/me");
  return {
    props: {},
  };
});
