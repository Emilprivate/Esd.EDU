using P4.TinyCell.Shared.Utilities;

namespace P4.TinyCell.Shared.Language.RegisterAllocation
{
    public class LivenessGraphGenerator
    {
        public Graph<string> generateGraph(List<IInstruction> instructions)
        {
            var graph = new Graph<string>();

            foreach (var instruction in instructions)
            {
                HashSet<string> gen = instruction.getGen();
                HashSet<string> kill = instruction.getKill();

                foreach (var variable in gen)
                {
                    if (!graph.adjacencyList.ContainsKey(variable))
                    {
                        graph.adjacencyList.Add(variable, new HashSet<string>());
                    }
                }

                foreach (var variable in kill)
                {
                    if (!graph.adjacencyList.ContainsKey(variable))
                    {
                        graph.adjacencyList.Add(variable, new HashSet<string>());
                    }
                }

                HashSet<string> outs = instruction.getOuts();

                foreach (string x in kill)
                {
                    foreach (string y in outs)
                    {
                        if (x != y && (!gen.Contains(x) && !kill.Contains(y) || gen.Count != 1 || kill.Count != 1))
                        {
                            graph.AddEdge(x, y);
                        }
                    }
                }
            }

            return graph;
        }
    }
}