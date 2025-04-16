"use client";

import { useState } from "react";
import { columns } from "./Table/Columns";
import { Database } from "../../../../database.types";
import { DocumentsTable } from "./Table/DocumentsTable";
import { Tabs, TabsContent } from "@/components/ui/tabs";

const DocumentTabs = ({
  documents,
}: {
  documents: Database["public"]["Tables"]["documents"]["Row"][];
}) => {
  const [selectedTab, setSelectedTab] = useState("inbox");

  return (
    <Tabs
      defaultValue={selectedTab}
      onValueChange={(value) => setSelectedTab(value)}
    >
      <TabsContent value="inbox">
        <DocumentsTable
          columns={columns}
          data={documents ?? []}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      </TabsContent>
      <TabsContent value="sent">
        <DocumentsTable
          columns={columns}
          data={documents ?? []}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      </TabsContent>
    </Tabs>
  );
};

export default DocumentTabs;
