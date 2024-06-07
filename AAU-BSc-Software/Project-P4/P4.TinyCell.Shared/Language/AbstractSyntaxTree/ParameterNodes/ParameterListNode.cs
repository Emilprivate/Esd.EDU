namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.ParameterNodes;

public class ParameterListNode : AstNode
{
    public ParameterNode[] Parameters { get; }

    public ParameterListNode(ParameterNode[] parameters)
    {
        Parameters = parameters;

        foreach (ParameterNode parameter in parameters)
        {
            AddChild(parameter);
        }
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitParameterListNode(this);
    }
}