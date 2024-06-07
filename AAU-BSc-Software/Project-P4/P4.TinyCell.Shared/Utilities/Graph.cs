namespace P4.TinyCell.Shared.Utilities
{
    /// <summary>
    /// Class for creating vertex-edge graphs
    /// </summary>
    /// <typeparam name="T">Vertex type</typeparam>
    public class Graph<T>
    {
        public Dictionary<T, HashSet<T>> adjacencyList;

        public Graph()
        {
            adjacencyList = new Dictionary<T, HashSet<T>>();
        }

        /// <summary>
        /// Add a vertex to the graph
        /// </summary>
        /// <param name="vertex">Vertex to add to the graph</param>
        public void AddVertex(T vertex)
        {
            if (!adjacencyList.ContainsKey(vertex))
            {
                adjacencyList[vertex] = new HashSet<T>();
            }
        }

        /// <summary>
        /// Add an edge between two vertices
        /// </summary>
        /// <param name="source">Source vertex</param>
        /// <param name="destination">Destination vertex</param>
        public void AddEdge(T source, T destination)
        {
            // Add vertices to the graph if they don't exist
            AddVertex(source);
            AddVertex(destination);

            // Add the edge between the vertices
            adjacencyList[source].Add(destination);
            adjacencyList[destination].Add(source);
        }

        /// <summary>
        /// Prints the graph
        /// </summary>
        // 
        public void PrintGraph()
        {
            foreach (var vertex in adjacencyList)
            {
                Console.Write($"{vertex.Key}: ");
                foreach (var neighbor in vertex.Value)
                {
                    Console.Write($"{neighbor} ");
                }

                Console.WriteLine();
            }
        }
    }
}