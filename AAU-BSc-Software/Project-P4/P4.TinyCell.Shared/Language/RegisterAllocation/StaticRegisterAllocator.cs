namespace P4.TinyCell.Shared.Language.RegisterAllocation
{
    public class StaticRegisterAllocator
    {
        /// <summary>
        /// Allocates registers for variables
        /// </summary>
        /// <param name="interferenceGraph">Inteference graph</param>
        /// <param name="numRegisters">Number of available registers</param>
        /// <returns></returns>
        public Dictionary<string, string> AllocateRegisters(Dictionary<string, HashSet<string>> interferenceGraph,
            int numRegisters)
        {
            Dictionary<string, string> allocationGroupings = [];
            Stack<KeyValuePair<string, HashSet<string>>> stack = [];

            // Simplify
            while (interferenceGraph.Count > 0)
            {
                bool somepushed = false;
                foreach (var vertexEntry in interferenceGraph)
                {
                    if (vertexEntry.Value.Count < numRegisters)
                    {
                        stack.Push(vertexEntry);
                        somepushed = true;
                        RemoveVertex(vertexEntry, interferenceGraph);
                    }
                }

                if (!somepushed)
                {
                    var vertex = interferenceGraph.First();
                    stack.Push(vertex);
                    RemoveVertex(vertex, interferenceGraph);
                }
            }

            // Select
            while (stack.Count > 0)
            {
                var vertex = stack.Pop();
                string vertexName = vertex.Key;
                HashSet<string> neighbours = vertex.Value;
                HashSet<string> usedColors = new HashSet<string>();

                // Check colours of neighbours
                foreach (var neighbour in neighbours)
                {
                    if (allocationGroupings.ContainsKey(neighbour))
                    {
                        string color = allocationGroupings[neighbour];
                        usedColors.Add(color);
                    }
                }

                // Assign a color to the vertex
                string colorForVertex = GetUnusedColor(usedColors, numRegisters);
                if (colorForVertex != null)
                {
                    allocationGroupings[vertexName] = colorForVertex;
                }
                else
                {
                    // If no available color, mark for spilling
                    allocationGroupings[vertexName] = "spill";
                }
            }

            return allocationGroupings;
        }

        private void RemoveVertex(KeyValuePair<string, HashSet<string>> vertex,
            Dictionary<string, HashSet<string>> interferenceGraph)
        {
            interferenceGraph.Remove(vertex.Key);
            foreach (var neighbor in vertex.Value)
            {
                interferenceGraph[neighbor].Remove(vertex.Key);
            }
        }

        private string GetUnusedColor(HashSet<string> usedColors, int numRegisters)
        {
            for (int i = 0; i < numRegisters; i++)
            {
                string color = "r" + i.ToString();
                if (!usedColors.Contains(color))
                {
                    return color;
                }
            }

            return null; // No available color
        }
    }
}