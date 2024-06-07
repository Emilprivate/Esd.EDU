namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;

public class StatementCollectionNode : AstNode
{
    public AstNode[] Statements { get; set; }

    public StatementCollectionNode(AstNode[] statements)
    {
        Statements = statements;

        foreach (AstNode statement in statements)
        {
            AddChild(statement);
        }
    }

    public int Count => Statements.Length;

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitStatementCollectionNode(this);
    }
}