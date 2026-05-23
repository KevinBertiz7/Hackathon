import numpy as np


class KohonenSOM:
    def __init__(
        self,
        input_dim: int,
        neurons: int,
        iterations: int = 100,
        neighborhood: float = 0.2,
        competition: str = "soft"
    ):
        self.input_dim = input_dim
        self.neurons = neurons
        self.iterations = iterations
        self.neighborhood = neighborhood
        self.competition = competition

        self.weights = np.random.uniform(
            -1,
            1,
            size=(input_dim, neurons)
        )

        self.dm_history = []

    def euclidean_distances(self, pattern):
        distances = []

        for i in range(self.neurons):
            neuron_weight = self.weights[:, i]
            distance = np.sqrt(np.sum((pattern - neuron_weight) ** 2))
            distances.append(distance)

        return np.array(distances)

    def train(self, X):
        X = np.array(X, dtype=np.float32)

        for iteration in range(1, self.iterations + 1):
            learning_rate = 1 / iteration
            winner_distances = []

            for pattern in X:
                distances = self.euclidean_distances(pattern)

                winner_index = int(np.argmin(distances))
                winner_distance = float(distances[winner_index])
                winner_distances.append(winner_distance)

                if self.competition == "soft":
                    threshold = winner_distance + self.neighborhood

                    active_neurons = [
                        i for i, d in enumerate(distances)
                        if d <= threshold
                    ]
                else:
                    active_neurons = [winner_index]

                for neuron in active_neurons:
                    self.weights[:, neuron] = (
                        self.weights[:, neuron]
                        + learning_rate * (pattern - self.weights[:, neuron])
                    )

            dm = float(np.mean(winner_distances))
            self.dm_history.append(dm)

            if dm <= 0.01:
                break

        return {
            "weights": self.weights.tolist(),
            "dm_history": self.dm_history,
            "iterations_completed": len(self.dm_history)
        }

    def simulate(self, pattern):
        pattern = np.array(pattern, dtype=np.float32)

        distances = self.euclidean_distances(pattern)
        winner_index = int(np.argmin(distances))

        return {
            "winner_neuron": winner_index + 1,
            "winner_distance": float(distances[winner_index]),
            "distances": distances.tolist(),
            "winner_weights": self.weights[:, winner_index].tolist()
        }