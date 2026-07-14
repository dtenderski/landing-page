import { useQuery } from "@tanstack/react-query";
import type { KnowledgeTaxonomyTreeNode } from "@shared/schema";

/**
 * Hook untuk membaca seluruh pohon taksonomi knowledge base
 * (Sektor → Subsektor → Topik → Klausul). Dipakai oleh form KB
 * untuk dropdown cascade dan oleh halaman pratinjau "isi sektor".
 */
export function useTaxonomy() {
  return useQuery<KnowledgeTaxonomyTreeNode[]>({
    queryKey: ["/api/taxonomy"],
  });
}
